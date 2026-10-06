# Recorta o fundo do retrato do Luciano e gera as imagens usadas na
# secao "QUEM FAZ" do site. Rode de novo se a foto original for trocada:
#
#   python tools\build-photo-luciano.py
#
# Requer: pillow, numpy, scipy  (python -m pip install pillow numpy scipy)
#
# Entrada:  assets/fotos/luciano_nova.png
# Saidas:   assets/fotos/luciano.png   (fundo transparente, sem perdas)
#           assets/fotos/luciano.webp  (mesma imagem, menor, usada no site)
#
# Aceita dois fundos de estudio: cinza (retrato atual) ou preto solido.
# A camiseta preta no fundo preto fica um pouco mais clara que o cenario
# (luma ~20-40 contra ~0), e e isso que segura o recorte.
#
# Este retrato ja esta reto: o giro de cabeca da versao antiga nao roda.
# A nitidez do JPEG e preservada; so a mascara da borda e suavizada.
#
# Como o recorte funciona: uma mascara grosseira pega o fundo ligado a borda
# (cinza de croma baixo e luma media, ou preto de luma baixa). Com ela o
# script ajusta um polinomio que descreve o degrade real do fundo, sombras
# incluidas, e so entao mede o quanto cada pixel foge desse fundo.

from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "fotos" / "luciano_nova.png"
OUT_PNG = ROOT / "assets" / "fotos" / "luciano.png"
OUT_WEBP = ROOT / "assets" / "fotos" / "luciano.webp"

# Largura final: 940 cobre tela 2x (max 470px no CSS). A foto atual tem
# ~1150px, entao so reduz; o realce leve no fim devolve a borda do Lanczos.
TARGET_WIDTH = 940

# Limites da mascara grosseira no fundo cinza (ver comentario do topo).
COARSE_CHROMA = 14.0
COARSE_LUMA = 58.0
# Fundo preto: luma abaixo disso e ligado a borda conta como cenario.
COARSE_BLACK_LUMA = 8.0

# Faixa de distancia de cor (0-255) ate o fundo ajustado que separa fundo de
# pessoa. Abaixo de LO o pixel e fundo puro, acima de HI e pessoa, no meio vira
# semitransparente. No fundo preto a faixa e mais estreita: a camiseta e
# escura, mas ainda distante do preto puro.
DIST_LO = 14.0
DIST_HI = 38.0
DIST_LO_BLACK = 6.0
DIST_HI_BLACK = 18.0
ALPHA_SHRINK = 0.16
ALPHA_SHRINK_BLACK = 0.08

# Dissolvencias nas bordas do corte (fracao da altura/largura). Zeradas: o
# retrato termina em corte reto e a profundidade vem da sombra no CSS
# (.about-portrait img). Se voltar a usar, o logo da camiseta termina em ~90%
# da altura e ~81% da largura do recorte e nao pode desbotar.
FADE_BOTTOM = 0.0
FADE_BOTTOM_LONG = 0.0
FADE_BOTTOM_LONG_DEPTH = 0.35
FADE_SIDES = 0.0
# Corta o rodape da foto antes do recorte: os antebracos aparecem so nos
# cantos de baixo (a partir de ~89% da altura) e virariam pontas soltas de
# pele no corte reto. O logo termina em ~83%.
CROP_BOTTOM = 0.115

POLY_DEGREE = 5


def poly_basis(h, w):
    yy, xx = np.mgrid[0:h, 0:w]
    xx = xx / w
    yy = yy / h
    terms = [(xx ** i) * (yy ** j)
             for i in range(POLY_DEGREE + 1)
             for j in range(POLY_DEGREE + 1 - i)]
    return np.stack([t.ravel() for t in terms], axis=1)


def keep_border_components(mask):
    """Mantem so as regioes da mascara que encostam na borda da imagem."""
    labels, count = ndimage.label(mask)
    if not count:
        return np.zeros_like(mask)
    border = np.concatenate([labels[0, :], labels[-1, :], labels[:, 0], labels[:, -1]])
    return np.isin(labels, np.unique(border[border > 0]))


def is_black_studio(rgb):
    """Fundo preto solido se a borda da foto for bem escura."""
    border = np.concatenate([
        rgb[0].reshape(-1, 3),
        rgb[-1].reshape(-1, 3),
        rgb[:, 0],
        rgb[:, -1],
    ])
    luma = border @ np.array([0.299, 0.587, 0.114])
    return float(np.median(luma)) < 25.0


def coarse_background(rgb, black_studio):
    luma = rgb @ np.array([0.299, 0.587, 0.114])
    chroma = rgb.max(axis=2) - rgb.min(axis=2)
    if black_studio:
        return keep_border_components(luma < COARSE_BLACK_LUMA)
    return keep_border_components((chroma < COARSE_CHROMA) & (luma > COARSE_LUMA))


def fit_background(rgb, sample, basis):
    """Descreve a cor do fundo em cada ponto, inclusive onde ha sombra."""
    h, w, _ = rgb.shape
    flat = sample.ravel()
    # Subamostra: o degrade e suave, nao precisa de todos os pixels no ajuste.
    index = np.flatnonzero(flat)[::7]

    model = np.empty_like(rgb)
    for c in range(3):
        target = rgb[:, :, c].ravel()
        rows = index
        for _ in range(3):
            coef, *_ = np.linalg.lstsq(basis[rows], target[rows], rcond=None)
            resid = np.abs(target[index] - basis[index] @ coef)
            sigma = max(resid.std(), 1.0)
            rows = index[resid < 2.5 * sigma]
        model[:, :, c] = (basis @ coef).reshape(h, w)
    return model


def build_alpha(rgb, model, dist_lo, dist_hi, shrink):
    h, w, _ = rgb.shape
    dist = np.linalg.norm(rgb - model, axis=2)

    # Transicao suave: pixels de borda ficam parcialmente transparentes em vez
    # de serrilhados.
    soft = np.clip((dist - dist_lo) / (dist_hi - dist_lo), 0.0, 1.0)

    # So e fundo o que parece fundo E esta ligado a borda da imagem. Assim os
    # cinzas/pretos dentro da camiseta ou do logo nao viram buracos.
    outside = keep_border_components(dist < dist_hi)

    alpha = np.where(outside, soft, 1.0)
    alpha = np.where(ndimage.binary_fill_holes(alpha > 0.5), 1.0, alpha)

    # Encolhe um fio e suaviza so a mascara: tira o halo do estudio sem
    # embacar o retrato. A cor da pessoa nao e desfocada aqui.
    alpha = np.clip((alpha - shrink) / (1.0 - shrink), 0.0, 1.0)
    alpha = ndimage.gaussian_filter(alpha, 0.85)

    # Smoothstep: entra e sai da dissolvencia sem degrau visivel.
    def ease(n):
        t = np.linspace(0.0, 1.0, n)
        return t * t * (3.0 - 2.0 * t)

    fade = int(h * FADE_BOTTOM_LONG)
    if fade > 0:
        alpha[h - fade:, :] *= (1.0 - FADE_BOTTOM_LONG_DEPTH * ease(fade))[:, None]

    fade = int(h * FADE_BOTTOM)
    if fade > 0:
        alpha[h - fade:, :] *= ease(fade)[::-1, None]

    side = int(w * FADE_SIDES)
    if side > 0:
        ramp = ease(side)
        alpha[:, :side] *= ramp[None, :]
        alpha[:, w - side:] *= ramp[::-1][None, :]
    return alpha


def decontaminate(rgb, alpha, model):
    """Remove a cor do fundo que sobra nos pixels semitransparentes da borda."""
    a = alpha[:, :, None]
    mixed = (a > 0.02) & (a < 0.98)
    clean = np.where(mixed, (rgb - (1.0 - a) * model) / np.maximum(a, 0.02), rgb)
    return np.clip(clean, 0.0, 255.0)


def paint_fringe(rgba):
    """A borda nao pode herdar RGB preto dos pixels transparentes — isso
    vira o serrilhado escuro no papel claro da pagina. Espalha a cor da
    pessoa para o fio semitransparente."""
    color = rgba[:, :, :3].astype(np.float64)
    alpha = rgba[:, :, 3].astype(np.float64)
    trust = np.clip((alpha - 80.0) / 140.0, 0.0, 1.0)
    trusted = color * trust[..., None]
    wblur = ndimage.gaussian_filter(trust, 2.4)
    filled = np.stack(
        [ndimage.gaussian_filter(trusted[:, :, c], 2.4) for c in range(3)],
        axis=2,
    ) / np.maximum(wblur, 1e-4)[..., None]
    # So o fio da mascara (nao o rosto nem a camiseta).
    mix = np.clip((160.0 - alpha) / 140.0, 0.0, 1.0)
    color = color * (1.0 - mix)[..., None] + filled * mix[..., None]
    return np.dstack([np.clip(color, 0.0, 255.0), alpha]).round().astype(np.uint8)


# Gira a cabeca no recorte transparente (positivo = horario). A foto original
# pende a cabeca cerca de 7-8 graus no sentido horario; o inverso alinha.
HEAD_STRAIGHTEN_DEG = -5.0
HEAD_PIVOT = (0.46, 0.34)
HEAD_FADE = (0.24, 0.40)


def straighten_head(rgba, angle_deg=HEAD_STRAIGHTEN_DEG, pivot=HEAD_PIVOT, fade=HEAD_FADE):
    """Gira cabeca e pescoco no recorte, deixando o tronco no lugar."""
    color = rgba[:, :, :3].astype(np.float64)
    alpha = rgba[:, :, 3].astype(np.float64)
    h, w = alpha.shape
    cx, cy = w * pivot[0], h * pivot[1]
    fade_start, fade_end = fade

    angle = np.deg2rad(angle_deg)
    cos_a, sin_a = np.cos(angle), np.sin(angle)
    yy, xx = np.mgrid[0:h, 0:w]
    dx = xx - cx
    dy = yy - cy
    src_x = cos_a * dx + sin_a * dy + cx
    src_y = -sin_a * dx + cos_a * dy + cy
    coords = [src_y, src_x]

    rot_color = np.empty_like(color)
    for c in range(3):
        rot_color[:, :, c] = ndimage.map_coordinates(
            color[:, :, c], coords, order=1, mode="constant", cval=0.0
        )
    rot_alpha = ndimage.map_coordinates(
        alpha, coords, order=1, mode="constant", cval=0.0
    )

    t = np.clip((fade_end * h - yy) / ((fade_end - fade_start) * h), 0.0, 1.0)
    vertical = t * t * (3.0 - 2.0 * t)
    half = 0.22 + 0.14 * vertical
    side = np.clip((half - np.abs(xx - cx) / w) / 0.07, 0.0, 1.0)
    head = ndimage.gaussian_filter(vertical * (vertical + (1.0 - vertical) * side), 6.0)
    head = head[..., None]
    torso = 1.0 - head

    premul = color * alpha[..., None]
    rot_premul = rot_color * rot_alpha[..., None]
    out_premul = premul * torso + rot_premul * head
    out_alpha = np.clip(alpha[..., None] * torso + rot_alpha[..., None] * head, 0.0, 255.0)
    out_color = out_premul / np.maximum(out_alpha, 1.0)

    return np.dstack([out_color, out_alpha[:, :, 0]]).round().astype(np.uint8)


def recover_resize(rgba):
    """O Lanczos no aumento para 900px amacia um pouco. Devolve so o
    detalhe que ja existia no JPEG, sem o unsharp forte que serrilhava."""
    color = rgba[:, :, :3].astype(np.float64)
    alpha = rgba[:, :, 3].astype(np.float64)
    luma_w = np.array([0.299, 0.587, 0.114])
    luma = color @ luma_w
    detail = luma - ndimage.gaussian_filter(luma, 0.7)
    luma = np.clip(luma + np.where(np.abs(detail) > 2.2, 0.32 * detail, 0.0), 0.0, 255.0)
    old = np.maximum(color @ luma_w, 1.0)
    color = np.clip(color * (luma / old)[..., None], 0.0, 255.0)
    weight = np.clip((alpha - 200.0) / 40.0, 0.0, 1.0)
    mixed = rgba[:, :, :3].astype(np.float64) * (1.0 - weight[..., None]) + color * weight[..., None]
    return np.dstack([mixed, alpha]).round().astype(np.uint8)


def main():
    rgb = np.asarray(Image.open(SRC).convert("RGB"), dtype=np.float64)
    rgb = rgb[: round(rgb.shape[0] * (1.0 - CROP_BOTTOM))]
    h, w, _ = rgb.shape
    black_studio = is_black_studio(rgb)
    if black_studio:
        dist_lo, dist_hi, shrink = DIST_LO_BLACK, DIST_HI_BLACK, ALPHA_SHRINK_BLACK
    else:
        dist_lo, dist_hi, shrink = DIST_LO, DIST_HI, ALPHA_SHRINK

    basis = poly_basis(h, w)
    model = fit_background(rgb, coarse_background(rgb, black_studio), basis)
    alpha = build_alpha(rgb, model, dist_lo, dist_hi, shrink)
    color = decontaminate(rgb, alpha, model)

    rgba = np.dstack([color, alpha * 255.0])
    image = Image.fromarray(rgba.round().astype(np.uint8), "RGBA")

    # Corta o vazio ao redor para o CSS enquadrar a pessoa, nao a moldura.
    box = image.getbbox()
    if box:
        image = image.crop(box)

    if image.width != TARGET_WIDTH:
        height = round(image.height * TARGET_WIDTH / image.width)
        image = image.resize((TARGET_WIDTH, height), Image.LANCZOS)

    image = Image.fromarray(paint_fringe(np.asarray(image)), "RGBA")
    image = Image.fromarray(recover_resize(np.asarray(image)), "RGBA")

    OUT_PNG.parent.mkdir(parents=True, exist_ok=True)
    image.save(OUT_PNG, optimize=True)
    image.save(OUT_WEBP, quality=93, method=6)

    print(f"gerado: {OUT_PNG}  ({image.width}x{image.height})")
    print(f"gerado: {OUT_WEBP}")


if __name__ == "__main__":
    main()
