"""Font helper for the profile SVG generators (needs: pip install fonttools brotli).

  font_tools.py subset <font.ttf> <out.woff2> <text-file>   subset to the characters in text-file
  font_tools.py advances <font.ttf> <text-file>             JSON {"upm": n, "adv": {char: advance}}
"""
import json
import subprocess
import sys


def read_chars(path):
    with open(path, encoding="utf-8") as fh:
        return "".join(sorted(set(fh.read())))


def subset(font, out, text_file):
    chars = read_chars(text_file)
    with open(text_file + ".uni", "w", encoding="utf-8") as fh:
        fh.write(",".join("U+%04X" % ord(c) for c in chars))
    subprocess.run(
        [
            sys.executable, "-m", "fontTools.subset", font,
            "--unicodes-file=" + text_file + ".uni",
            "--flavor=woff2", "--output-file=" + out,
            "--layout-features=kern,tnum,ccmp,locl,mark,mkmk",
            "--no-hinting", "--drop-tables+=DSIG",
        ],
        check=True,
    )


def advances(font, text_file):
    from fontTools.ttLib import TTFont

    f = TTFont(font)
    cmap = f.getBestCmap()
    hmtx = f["hmtx"]
    adv = {}
    for ch in read_chars(text_file):
        g = cmap.get(ord(ch))
        if g:
            adv[ch] = hmtx[g][0]
    print(json.dumps({"upm": f["head"].unitsPerEm, "adv": adv}, ensure_ascii=True))


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "subset":
        subset(sys.argv[2], sys.argv[3], sys.argv[4])
    elif cmd == "advances":
        advances(sys.argv[2], sys.argv[3])
    else:
        sys.exit(__doc__)
