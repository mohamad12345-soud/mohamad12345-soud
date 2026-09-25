#!/usr/bin/env python3
"""يضيف بصمة المحتوى (?v=...) لروابط ملفات CSS/JS في app/index.html.

كل ما تغيّر ملف، تتغيّر البصمة، فيجبر المتصفح يحمّل النسخة الجديدة بدل النسخة المخزّنة (cache)
— بدون هيك ممكن ينحمل HTML جديد مع JS/CSS قديم وتخرب الأزرار.

الاستخدام (بعد أي تعديل على ملفات app/):  python3 project/tools/stamp_assets.py
"""
import hashlib
import os
import re

APP = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "app")
ASSETS = ["app.css", "app.js", "layers-config.js"]


def main():
    path = os.path.join(APP, "index.html")
    html = open(path, encoding="utf-8").read()
    for name in ASSETS:
        digest = hashlib.sha256(open(os.path.join(APP, name), "rb").read()).hexdigest()[:10]
        html, n = re.subn(r'(["\'])' + re.escape(name) + r'(\?v=[0-9a-f]*)?\1', r"\g<1>" + name + "?v=" + digest + r"\g<1>", html)
        if n != 1:
            raise SystemExit("expected one reference to %s in index.html, found %d" % (name, n))
        print(name, digest)
    open(path, "w", encoding="utf-8").write(html)


if __name__ == "__main__":
    main()
