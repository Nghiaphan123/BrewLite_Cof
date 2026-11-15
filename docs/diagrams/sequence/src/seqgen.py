"""Tiny sequence-diagram generator: one spec -> PlantUML source (.puml) + SVG.

Spec steps:
  ("msg", a, b, text)          solid arrow (request)
  ("ret", a, b, text)          dashed arrow (response)
  ("self", a, text)            self call
  ("alt"|"opt"|"loop", cond)   open a frame
  ("else", cond)               else branch of the current frame
  ("end",)                     close the frame
  ("div", text)                == section divider ==
  ("note", text)               note spanning every participant
"""

from __future__ import annotations

import html
from pathlib import Path

FONT = 13
LINE = 17
CHAR_W = 7.1
INK = "#1C1917"
BRAND = "#002C22"
MUTED = "#57534E"
HEAD_FILL = "#E7F0EC"
FRAME = "#78716C"


def tw(text: str) -> float:
    return max((len(line) for line in text.split("\n")), default=0) * CHAR_W


def esc(text: str) -> str:
    return html.escape(text, quote=True)


# ------------------------------------------------------------------ PlantUML
def to_puml(name: str, title: str, parts, steps) -> str:
    out = [f"@startuml {name}", f"title {title}", "skinparam shadowing false",
           "skinparam backgroundColor #FFFFFF", "skinparam sequenceMessageAlign left",
           "autonumber", ""]
    for pid, label, kind in parts:
        out.append(f'{kind} "{label.replace(chr(10), "\\n")}" as {pid}')
    out.append("")
    depth = 0
    first, last = parts[0][0], parts[-1][0]
    for st in steps:
        kind = st[0]
        pad = "  " * depth
        if kind in ("msg", "ret"):
            arrow = "->" if kind == "msg" else "-->"
            out.append(f"{pad}{st[1]} {arrow} {st[2]}: {st[3].replace(chr(10), '\\n')}")
        elif kind == "self":
            out.append(f"{pad}{st[1]} -> {st[1]}: {st[2].replace(chr(10), '\\n')}")
        elif kind in ("alt", "opt", "loop"):
            out.append(f"{pad}{kind} {st[1]}")
            depth += 1
        elif kind == "else":
            out.append(f"{'  ' * (depth - 1)}else {st[1]}")
        elif kind == "end":
            depth -= 1
            out.append(f"{'  ' * depth}end")
        elif kind == "div":
            out.append(f"== {st[1]} ==")
        elif kind == "note":
            out.append(f"{pad}note over {first}, {last}: {st[1].replace(chr(10), '\\n')}")
    out.append("@enduml")
    return "\n".join(out) + "\n"


# ------------------------------------------------------------------ SVG
def to_svg(title: str, parts, steps) -> str:
    ids = [p[0] for p in parts]
    idx = {pid: i for i, pid in enumerate(ids)}
    n = len(parts)
    box_w = [max(110, tw(p[1]) + 28) for p in parts]

    # gaps between neighbouring centres, widened for labels that must fit
    gap = [max(box_w[i] / 2 + box_w[i + 1] / 2 + 30, 150) for i in range(n - 1)]
    right_pad = 40.0
    num = 0
    for st in steps:
        if st[0] in ("msg", "ret"):
            num += 1
            a, b = sorted((idx[st[1]], idx[st[2]]))
            need = tw(f"{num}. {st[3]}") + 36
            have = sum(gap[a:b])
            if have < need:
                gap[b - 1] += need - have
        elif st[0] == "self":
            num += 1
            i = idx[st[1]]
            need = tw(f"{num}. {st[2]}") + 50
            if i < n - 1:
                if gap[i] < need:
                    gap[i] = need
            else:
                right_pad = max(right_pad, need)

    left = 30 + max(box_w[0] / 2, 60)
    xs = [left]
    for g in gap:
        xs.append(xs[-1] + g)
    width = xs[-1] + max(box_w[-1] / 2, right_pad) + 30

    body: list[str] = []
    title_h = 46
    head_h = [70 if p[2] == "actor" else 50 for p in parts]
    top = title_h + max(head_h)
    y = top + 24
    frames: list[dict] = []
    num = 0
    frame_x0 = xs[0] - box_w[0] / 2 - 6
    frame_x1 = xs[-1] + max(box_w[-1] / 2 + 6, right_pad - 10)

    def text_block(x, y0, text, anchor="start", weight="normal", color=INK, size=FONT):
        lines = text.split("\n")
        spans = "".join(
            f'<tspan x="{x:.1f}" dy="{0 if k == 0 else LINE}">{esc(line)}</tspan>'
            for k, line in enumerate(lines)
        )
        return (f'<text x="{x:.1f}" y="{y0:.1f}" font-size="{size}" fill="{color}" '
                f'font-weight="{weight}" text-anchor="{anchor}">{spans}</text>')

    for st in steps:
        kind = st[0]
        if kind in ("msg", "ret"):
            num += 1
            x1, x2 = xs[idx[st[1]]], xs[idx[st[2]]]
            label = f"{num}. {st[3]}"
            lines = label.count("\n") + 1
            ty = y + 12
            arrow_y = ty + (lines - 1) * LINE + 9
            lx = min(x1, x2) + 10
            body.append(text_block(lx, ty, label))
            dash = ' stroke-dasharray="6 4"' if kind == "ret" else ""
            marker = "url(#open)" if kind == "ret" else "url(#solid)"
            body.append(f'<line x1="{x1:.1f}" y1="{arrow_y:.1f}" x2="{x2:.1f}" y2="{arrow_y:.1f}" '
                        f'stroke="{BRAND}" stroke-width="1.4"{dash} marker-end="{marker}"/>')
            y = arrow_y + 16
        elif kind == "self":
            num += 1
            x = xs[idx[st[1]]]
            label = f"{num}. {st[2]}"
            lines = label.count("\n") + 1
            ty = y + 12
            body.append(text_block(x + 34, ty + 4, label))
            loop_h = max(24, (lines - 1) * LINE + 18)
            body.append(f'<path d="M{x:.1f},{ty - 6:.1f} h26 v{loop_h:.1f} h-24" fill="none" '
                        f'stroke="{BRAND}" stroke-width="1.4" marker-end="url(#solid)"/>')
            y = ty + loop_h + 6
        elif kind in ("alt", "opt", "loop"):
            depth = len(frames)
            frames.append({"kind": kind, "y0": y + 4, "x0": frame_x0 + depth * 10,
                           "x1": frame_x1 - depth * 10, "elses": [], "cond": st[1]})
            y += 34
        elif kind == "else":
            frames[-1]["elses"].append((y + 2, st[1]))
            y += 30
        elif kind == "end":
            fr = frames.pop()
            y1 = y + 4
            x0, x1 = fr["x0"], fr["x1"]
            tag_w = len(fr["kind"]) * 8 + 22
            body.append(f'<rect x="{x0:.1f}" y="{fr["y0"]:.1f}" width="{x1 - x0:.1f}" '
                        f'height="{y1 - fr["y0"]:.1f}" fill="none" stroke="{FRAME}" stroke-width="1"/>')
            body.append(f'<path d="M{x0:.1f},{fr["y0"]:.1f} h{tag_w} v12 l-8,8 h-{tag_w - 8} z" '
                        f'fill="#F5F5F4" stroke="{FRAME}" stroke-width="1"/>')
            body.append(text_block(x0 + 7, fr["y0"] + 14, fr["kind"], weight="bold", size=12))
            body.append(text_block(x0 + tag_w + 10, fr["y0"] + 15, f'[{fr["cond"]}]',
                                   color=MUTED, weight="bold", size=12))
            for ey, cond in fr["elses"]:
                body.append(f'<line x1="{x0:.1f}" y1="{ey:.1f}" x2="{x1:.1f}" y2="{ey:.1f}" '
                            f'stroke="{FRAME}" stroke-width="1" stroke-dasharray="5 4"/>')
                body.append(text_block(x0 + 10, ey + 16, f"[{cond}]", color=MUTED,
                                       weight="bold", size=12))
            y = y1 + 10
        elif kind == "div":
            body.append(f'<line x1="{frame_x0:.1f}" y1="{y + 14:.1f}" x2="{frame_x1:.1f}" '
                        f'y2="{y + 14:.1f}" stroke="{BRAND}" stroke-width="1" stroke-dasharray="2 3"/>')
            w = tw(st[1]) + 24
            cx = (frame_x0 + frame_x1) / 2
            body.append(f'<rect x="{cx - w / 2:.1f}" y="{y + 3:.1f}" width="{w:.1f}" height="22" '
                        f'rx="4" fill="{BRAND}"/>')
            body.append(text_block(cx, y + 18, st[1], anchor="middle", color="#FFFFFF",
                                   weight="bold", size=12))
            y += 36
        elif kind == "note":
            lines = st[1].count("\n") + 1
            h = lines * LINE + 12
            inset = len(frames) * 10 + (6 if frames else 0)
            nx0, nx1 = frame_x0 + inset, frame_x1 - inset
            body.append(f'<rect x="{nx0:.1f}" y="{y + 4:.1f}" width="{nx1 - nx0:.1f}" '
                        f'height="{h:.1f}" rx="3" fill="#FEF9C3" stroke="#CA8A04" stroke-width="1"/>')
            body.append(text_block(nx0 + 10, y + 20, st[1], color="#713F12"))
            y += h + 14

    bottom = y + 16
    height = bottom + max(head_h) + 20

    # participants (top and bottom) and lifelines
    heads: list[str] = []
    for i, (pid, label, kind) in enumerate(parts):
        x, w = xs[i], box_w[i]
        heads.append(f'<line x1="{x:.1f}" y1="{top:.1f}" x2="{x:.1f}" y2="{bottom:.1f}" '
                     f'stroke="#A8A29E" stroke-width="1" stroke-dasharray="5 5"/>')
        for base in (title_h, bottom):
            heads.append(participant(x, base, w, label, kind, max(head_h)))

    defs = (
        '<defs>'
        f'<marker id="solid" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto">'
        f'<path d="M0,0 L10,5 L0,10 z" fill="{BRAND}"/></marker>'
        f'<marker id="open" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto">'
        f'<path d="M0,0 L10,5 L0,10" fill="none" stroke="{BRAND}" stroke-width="1.5"/></marker>'
        '</defs>'
    )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width:.0f}" height="{height:.0f}" '
        f'viewBox="0 0 {width:.0f} {height:.0f}" font-family="Segoe UI, Arial, sans-serif">'
        f'{defs}<rect width="100%" height="100%" fill="#FFFFFF"/>'
        f'<text x="{width / 2:.1f}" y="28" font-size="16" font-weight="bold" fill="{BRAND}" '
        f'text-anchor="middle">{esc(title)}</text>'
        + "".join(heads) + "".join(body) + "</svg>\n"
    )


def participant(x: float, base: float, w: float, label: str, kind: str, slot: float) -> str:
    lines = label.split("\n")
    if kind == "actor":
        top = base + 2
        fig = (f'<g stroke="{BRAND}" stroke-width="1.6" fill="none">'
               f'<circle cx="{x:.1f}" cy="{top + 7:.1f}" r="7"/>'
               f'<line x1="{x:.1f}" y1="{top + 14:.1f}" x2="{x:.1f}" y2="{top + 30:.1f}"/>'
               f'<line x1="{x - 11:.1f}" y1="{top + 19:.1f}" x2="{x + 11:.1f}" y2="{top + 19:.1f}"/>'
               f'<line x1="{x:.1f}" y1="{top + 30:.1f}" x2="{x - 9:.1f}" y2="{top + 42:.1f}"/>'
               f'<line x1="{x:.1f}" y1="{top + 30:.1f}" x2="{x + 9:.1f}" y2="{top + 42:.1f}"/></g>')
        txt = "".join(
            f'<text x="{x:.1f}" y="{top + 58 + k * LINE:.1f}" font-size="{FONT}" font-weight="bold" '
            f'fill="{INK}" text-anchor="middle">{esc(line)}</text>' for k, line in enumerate(lines))
        return fig + txt
    h = 22 + LINE * len(lines)
    y0 = base + (slot - h) / 2
    if kind == "database":
        shape = (f'<path d="M{x - w / 2:.1f},{y0 + 6:.1f} v{h - 6:.1f} '
                 f'a{w / 2:.1f},6 0 0 0 {w:.1f},0 v-{h - 6:.1f}" fill="{HEAD_FILL}" stroke="{BRAND}" stroke-width="1.4"/>'
                 f'<ellipse cx="{x:.1f}" cy="{y0 + 6:.1f}" rx="{w / 2:.1f}" ry="6" fill="{HEAD_FILL}" '
                 f'stroke="{BRAND}" stroke-width="1.4"/>')
        y_text = y0 + 25
    else:
        shape = (f'<rect x="{x - w / 2:.1f}" y="{y0:.1f}" width="{w:.1f}" height="{h:.1f}" rx="6" '
                 f'fill="{HEAD_FILL}" stroke="{BRAND}" stroke-width="1.4"/>')
        y_text = y0 + 20
    txt = "".join(
        f'<text x="{x:.1f}" y="{y_text + k * LINE:.1f}" font-size="{FONT}" font-weight="bold" '
        f'fill="{INK}" text-anchor="middle">{esc(line)}</text>' for k, line in enumerate(lines))
    return shape + txt


def render(out_dir: Path, name: str, title: str, parts, steps) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    depth = 0
    for st in steps:
        depth += st[0] in ("alt", "opt", "loop")
        depth -= st[0] == "end"
        assert depth >= 0, f"{name}: 'end' without frame"
    assert depth == 0, f"{name}: unclosed frame"
    (out_dir / f"{name}.puml").write_text(to_puml(name, title, parts, steps), encoding="utf-8")
    (out_dir / f"{name}.svg").write_text(to_svg(title, parts, steps), encoding="utf-8")
