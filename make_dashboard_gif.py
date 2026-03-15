#!/usr/bin/env python3
"""Generate an animated GIF of the Visionnaire member dashboard."""

from PIL import Image, ImageDraw, ImageFont
import math, os

# ── Palette ──────────────────────────────────────────────────────────
NAVY_DARKEST = (20, 36, 53)
NAVY_DARK    = (33, 55, 76)
NAVY         = (36, 66, 91)
STEEL        = (79, 133, 160)
GOLD         = (235, 193, 76)
GOLD_BRIGHT  = (252, 186, 51)
GOLD_LIGHT   = (249, 227, 141)
WHITE        = (255, 255, 255)
BG           = (244, 247, 250)
TEXT_DARK    = (20, 36, 53)
TEXT_MID     = (33, 55, 76)
TEXT_LIGHT   = (79, 133, 160)

def rgba(rgb, a): return rgb + (a,)

# ── Fonts ─────────────────────────────────────────────────────────────
SERIF_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SANS       = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
SANS_BOLD  = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

def font(path, size):
    try:    return ImageFont.truetype(path, size)
    except: return ImageFont.load_default()

fSerif22 = font(SERIF_BOLD, 22)
fSerif17 = font(SERIF_BOLD, 17)
fSerif14 = font(SERIF_BOLD, 14)
fSans13  = font(SANS, 13)
fSans12  = font(SANS, 12)
fSans11  = font(SANS, 11)
fSans10  = font(SANS, 10)
fBold13  = font(SANS_BOLD, 13)
fBold11  = font(SANS_BOLD, 11)
fBold10  = font(SANS_BOLD, 10)

# ── Canvas ────────────────────────────────────────────────────────────
W, H = 900, 560
PAD  = 20

# ── Helpers ───────────────────────────────────────────────────────────
def rounded_rect(draw, xy, r, fill, outline=None, outline_w=1):
    x0,y0,x1,y1 = xy
    draw.rounded_rectangle([x0,y0,x1,y1], radius=r, fill=fill,
                           outline=outline, width=outline_w)

def text_centered(draw, txt, x, y, w, fnt, color):
    bb = fnt.getbbox(txt)
    tw = bb[2]-bb[0]
    draw.text((x + (w-tw)//2, y), txt, font=fnt, fill=color)

def progress_bar(draw, x, y, w, h, pct, bg=(220,228,235), fg=None):
    if fg is None: fg = (NAVY[0], NAVY[1], NAVY[2])
    rounded_rect(draw, (x,y,x+w,y+h), h//2, bg)
    if pct > 0:
        fw = max(h, int(w * pct))
        rounded_rect(draw, (x,y,x+fw,y+h), h//2, fg)

def badge(draw, x, y, txt, bg, fg, fnt=None, pad_x=8, pad_y=3, r=20):
    if fnt is None: fnt = fBold10
    bb = fnt.getbbox(txt)
    tw, th = bb[2]-bb[0], bb[3]-bb[1]
    bw, bh = tw + pad_x*2, th + pad_y*2
    rounded_rect(draw, (x,y,x+bw,y+bh), r, bg)
    draw.text((x+pad_x, y+pad_y), txt, font=fnt, fill=fg)
    return bw, bh

# ── Drawing helpers ───────────────────────────────────────────────────
def draw_welcome_banner(draw, img, x, y, w, h):
    """Navy gradient banner with gold accents."""
    # Base gradient (left→right dark→slightly lighter)
    banner = Image.new("RGBA", (w, h), (0,0,0,0))
    bd = ImageDraw.Draw(banner)
    for i in range(w):
        t = i/w
        r = int(NAVY[0]*(1-t) + NAVY_DARK[0]*t)
        g = int(NAVY[1]*(1-t) + NAVY_DARK[1]*t)
        b = int(NAVY[2]*(1-t) + NAVY_DARK[2]*t)
        bd.line([(i,0),(i,h)], fill=(r,g,b,255))
    # Subtle glow top-right
    for gy in range(h):
        for gx in range(w-120, w):
            dx, dy = gx-(w-80), gy-0
            dist = math.sqrt(dx*dx+dy*dy)
            alpha = max(0, int(18 - dist/6))
            if alpha > 0:
                cur = banner.getpixel((gx,gy))
                new_r = min(255, cur[0]+alpha)
                new_g = min(255, cur[1]+alpha//2)
                banner.putpixel((gx,gy), (new_r,new_g,cur[2],255))
    # Paste banner with rounded corners mask
    mask = Image.new("L", (w,h), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0,0,w,h], radius=14, fill=255)
    img.paste(banner.convert("RGB"), (x,y), mask)
    # Gold border
    draw.rounded_rectangle([x,y,x+w,y+h], radius=14, outline=(235,193,76,50),
                            width=1)

    # Text
    draw.text((x+24, y+18), "Bonjour, Sophie !  \u2736", font=fSerif22, fill=WHITE)
    draw.text((x+24, y+46), "Tu es membre depuis 47 jours. Continue sur ta lancee !", font=fSans12, fill=(255,255,255,180))

    # Badge "4 formations en cours"
    bx = x + w - 260
    by = y + 14
    rounded_rect(draw, (bx, by, bx+110, by+52), 10,
                 (235,193,76,38), (235,193,76,76), 1)
    draw.text((bx+10, by+7), "4", font=fSerif17, fill=GOLD)
    draw.text((bx+10, by+30), "formations en cours", font=fSans10, fill=(255,255,255,178))

    # Palmares widget
    px = bx + 120
    py = by
    rounded_rect(draw, (px, py, px+118, py+52), 10,
                 (235,193,76,30), (235,193,76,89), 1)
    draw.text((px+8, py+4), "Batisseuse", font=fSerif14, fill=GOLD)
    draw.text((px+8, py+21), "1 240 pts d'Ambition", font=fSans10, fill=(255,255,255,178))
    # Mini bar
    bar_w = 100
    rounded_rect(draw, (px+8, py+38, px+8+bar_w, py+44), 3, (255,255,255,51))
    rounded_rect(draw, (px+8, py+38, px+8+int(bar_w*0.62), py+44), 3, GOLD_BRIGHT)

def draw_card(draw, x, y, w, h, r=12):
    """White card with subtle shadow/border."""
    # Shadow
    rounded_rect(draw, (x+2,y+2,x+w+2,y+h+2), r, (20,36,53,20))
    rounded_rect(draw, (x,y,x+w,y+h), r, WHITE, (20,36,53,20), 1)

def draw_formations_card(draw, x, y, w, h, prog_pcts):
    draw_card(draw, x, y, w, h)
    draw.text((x+18, y+16), "Mes formations en cours", font=fSerif17, fill=TEXT_DARK)
    draw.text((x+w-60, y+18), "Voir tout \u2192", font=fSans11, fill=STEEL)

    formations = [
        ("Les bases de la comptabilite", prog_pcts[0], "90%"),
        ("Lancer son offre de A a Z",    prog_pcts[1], "68%"),
        ("Trouver ses premiers clients", prog_pcts[2], "42%"),
    ]
    cy = y + 50
    for name, pct, label in formations:
        draw.text((x+18, cy), name, font=fSans12, fill=TEXT_DARK)
        draw.text((x+w-40, cy), label, font=fBold11, fill=GOLD_BRIGHT)
        progress_bar(draw, x+18, cy+18, w-36, 6, pct,
                     bg=(220,228,235), fg=NAVY_DARK)
        cy += 44

def draw_focus_card(draw, x, y, w, h):
    draw_card(draw, x, y, w, h)
    draw.text((x+18, y+16), "\U0001f31f Focus du jour", font=fSerif17, fill=TEXT_DARK)
    draw.text((x+w-80, y+18), "Voir le carnet \u2192", font=fSans11, fill=STEEL)

    items = [
        ("\u2022  Finaliser module 3 - Comptabilite", NAVY),
        ("\u2022  Partager une victoire en communaute", NAVY),
        ("\u2022  Preparer le Q&R de jeudi", NAVY),
    ]
    cy = y + 50
    for txt, col in items:
        rounded_rect(draw, (x+14, cy-2, x+w-14, cy+20), 6, (244,247,250))
        draw.text((x+20, cy), txt, font=fSans12, fill=col)
        cy += 30

    # Motivational quote
    q_y = cy + 6
    rounded_rect(draw, (x+14, q_y, x+w-14, q_y+42), 8, (235,193,76,25))
    draw.text((x+20, q_y+6), '"Chaque action compte, meme petite."', font=fSans11,
              fill=(140,100,0))

def draw_agenda_mini(draw, x, y, w, h):
    draw_card(draw, x, y, w, h)
    draw.text((x+18, y+14), "\U0001f4c5 Mon agenda", font=fSerif17, fill=TEXT_DARK)
    # Week toggle
    for i, (lbl, active) in enumerate([("Semaine", True), ("Mois", False)]):
        bx = x + w - 140 + i*68
        if active:
            rounded_rect(draw, (bx, y+12, bx+62, y+30), 6, NAVY_DARKEST)
            draw.text((bx+6, y+14), lbl, font=fBold11, fill=WHITE)
        else:
            draw.text((bx+6, y+14), lbl, font=fSans11, fill=TEXT_LIGHT)

    # Days header
    days = ["L","M","M","J","V","S","D"]
    day_w = (w - 60) // 7
    for i, d in enumerate(days):
        dx = x + 14 + i * day_w
        is_today = (i == 3)
        if is_today:
            rounded_rect(draw, (dx+day_w//2-10, y+38, dx+day_w//2+10, y+56), 10, GOLD_BRIGHT)
            draw.text((dx+day_w//2-4, y+40), d, font=fBold11, fill=NAVY_DARKEST)
        else:
            draw.text((dx+day_w//2-4, y+40), d, font=fSans11, fill=TEXT_LIGHT)

    # Mini event blocks
    events = [
        (1, 0.15, 0.30, "Coaching", (252,186,51,60), (252,186,51,200)),
        (3, 0.10, 0.22, "Masterclass", (20,36,53,25), (20,36,53,180)),
        (4, 0.35, 0.20, "Q&R Live", (74,158,106,50), (74,158,106,200)),
        (0, 0.50, 0.18, "Deadline", (220,85,85,40), (220,85,85,200)),
    ]
    ev_area_h = h - 70
    for day_i, top_pct, height_pct, label, bg, border in events:
        ex = x + 14 + day_i * day_w + 2
        ey = y + 62 + int(top_pct * ev_area_h)
        eh = max(20, int(height_pct * ev_area_h))
        ew = day_w - 4
        rounded_rect(draw, (ex, ey, ex+ew, ey+eh), 4, bg[:3])
        draw.rectangle([(ex, ey), (ex+3, ey+eh)], fill=border[:3])
        if eh > 22:
            draw.text((ex+6, ey+4), label, font=fSans10, fill=NAVY_DARKEST)

def draw_todo_card(draw, x, y, w, h, checked_idx=0):
    draw_card(draw, x, y, w, h)
    draw.text((x+14, y+14), "Ma to-do list", font=fSerif17, fill=TEXT_DARK)
    draw.text((x+w-60, y+16), "+ Ajouter", font=fSans11, fill=STEEL)

    todos = [
        ("Finir module 3 - Compta",  "Formation",  (79,133,160,38),   (79,133,160,200),  True),
        ("Repondre a Clara B.",       "Reseau",     (235,193,76,50),   (122,92,0,200),    False),
        ("Preparer Q&R du jeudi",     "Evenement",  (220,85,85,30),    (185,64,64,200),   False),
        ("Publier en communaute",     "Communaute", (74,158,106,38),   (45,122,80,200),   False),
        ("Plan d'action mensuel",     "Strategie",  (20,36,53,25),     (36,66,91,200),    False),
    ]

    cy = y + 46
    draw.text((x+14, cy-2), "Aujourd'hui", font=fBold10, fill=TEXT_LIGHT)
    cy += 14

    for i, (txt, tag, tag_bg, tag_fg, done) in enumerate(todos):
        if i == 2:
            cy += 4
            draw.text((x+14, cy), "Cette semaine", font=fBold10, fill=TEXT_LIGHT)
            cy += 14
        # Separator
        draw.line([(x+14, cy-3), (x+w-14, cy-3)], fill=(20,36,53,15))
        # Checkbox
        is_done = done or (i < checked_idx)
        if is_done:
            rounded_rect(draw, (x+14, cy+1, x+30, cy+17), 9, GOLD_BRIGHT)
            draw.text((x+17, cy+2), "\u2713", font=fBold11, fill=NAVY_DARKEST)
        else:
            draw.ellipse([(x+14, cy+1), (x+30, cy+17)], outline=(20,36,53,64), width=2)
        # Text
        col = (160,170,180) if is_done else TEXT_DARK
        draw.text((x+36, cy+2), txt, font=fSans11, fill=col)
        # Tag
        badge(draw, x+36, cy+16, tag, tag_bg[:3], tag_fg[:3], fSans10, 5, 2, 10)
        cy += 34

# ── Frame builder ─────────────────────────────────────────────────────
def build_frame(progress_pcts, checked_idx=0):
    """
    progress_pcts: (p1, p2, p3) float 0-1
    checked_idx: how many todos are checked
    """
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img, "RGBA")

    # ── Header / Sidebar hint ──────────────────────────────────────────
    # Thin left sidebar strip
    rounded_rect(draw, (0, 0, 52, H), 0, NAVY_DARKEST)
    # Sidebar icons (simplified dots)
    icons = ["\u25cf", "\u25cb", "\u25cb", "\u25cb", "\u25cb", "\u25cb"]
    for i, ic in enumerate(icons):
        draw.text((16, 80 + i*52), ic, font=fSerif14,
                  fill=GOLD if i==0 else (255,255,255,80))
    draw.text((10, 22), "LA", font=fBold13, fill=GOLD)
    draw.text((8, 34), "LIGUE", font=fSans10, fill=(255,255,255,120))

    cx = 62  # content x start
    cw = W - cx - PAD  # content width

    # ── Welcome Banner ─────────────────────────────────────────────────
    draw_welcome_banner(draw, img, cx, PAD, cw, 78)

    # ── Two-column cards ───────────────────────────────────────────────
    col_w = (cw - 16) // 2
    card_y = PAD + 78 + 14
    card_h = 176

    draw_formations_card(draw, cx, card_y, col_w, card_h, progress_pcts)
    draw_focus_card(draw, cx + col_w + 16, card_y, col_w, card_h)

    # ── Agenda + Todo ──────────────────────────────────────────────────
    row_y = card_y + card_h + 14
    todo_w = 224
    agenda_w = cw - todo_w - 16
    row_h = H - row_y - PAD

    draw_agenda_mini(draw, cx, row_y, agenda_w, row_h)
    draw_todo_card(draw, cx + agenda_w + 16, row_y, todo_w, row_h, checked_idx)

    # ── "Visionnaire" badge top-right ──────────────────────────────────
    badge(draw, W-100, 6, "\u25c6 VISIONNAIRE", GOLD, NAVY_DARKEST, fBold10, 8, 4, 12)

    return img

# ── Animation sequence ────────────────────────────────────────────────
TOTAL_FRAMES = 36
frames = []

for f in range(TOTAL_FRAMES):
    t = f / (TOTAL_FRAMES - 1)  # 0..1

    # Ease-in-out
    def ease(x): return x*x*(3-2*x)

    if f < 12:
        # Phase 1: progress bars filling in (0→target)
        ratio = ease(f / 12)
        p1 = 0.90 * ratio
        p2 = 0.68 * ratio
        p3 = 0.42 * ratio
        checked = 0
    elif f < 24:
        # Phase 2: static, hold
        p1, p2, p3 = 0.90, 0.68, 0.42
        checked = 0
    else:
        # Phase 3: todo item gets checked (one by one slowly)
        p1, p2, p3 = 0.90, 0.68, 0.42
        checked = min(1, f - 23)  # check 1st item

    img = build_frame((p1, p2, p3), checked)
    frames.append(img)

# ── Save GIF ──────────────────────────────────────────────────────────
out_path = "assets/dashboard-visionnaire.gif"
frames[0].save(
    out_path,
    save_all=True,
    append_images=frames[1:],
    optimize=False,
    duration=100,   # 100ms per frame → ~3.6s loop
    loop=0,
)
size_kb = os.path.getsize(out_path) // 1024
print(f"GIF saved: {out_path}  ({W}x{H}, {TOTAL_FRAMES} frames, {size_kb} KB)")
