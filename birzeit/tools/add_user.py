"""يولّد قيمة السر BIRZEIT_USERS (مستخدمين منصة بيرزيت) لتُلصق على Cloudflare.

الاستخدام:
    python birzeit/tools/add_user.py mohamad ahmad sara
بيسأل عن كلمة سر كل مستخدم (ما بتبين وقت الكتابة)، وبيطبع سطر JSON واحد.
الصقه على Cloudflare: Workers → mohamad12345-soud → Settings → Variables and Secrets
→ BIRZEIT_USERS (Type: Secret). أي تغيير هون بيطلّع كل المستخدمين المسجّلين دخول.

لإضافة مستخدم لقائمة موجودة: --add '<القيمة الحالية>' user_new
"""
import base64, getpass, hashlib, json, os, sys

ITERATIONS = 100000  # الحد الأعلى المسموح بـ PBKDF2 على Cloudflare Workers


def b64(b):
    return base64.urlsafe_b64encode(b).decode().rstrip('=')


def hash_password(password):
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, ITERATIONS, 32)
    return f'pbkdf2${ITERATIONS}${b64(salt)}${b64(dk)}'


def main(argv):
    users = {}
    if argv[:1] == ['--add']:
        users = json.loads(argv[1]); argv = argv[2:]
    if not argv:
        sys.exit(__doc__)
    for name in argv:
        name = name.strip().lower()
        while True:
            p1 = getpass.getpass(f'كلمة السر لـ {name}: ')
            if len(p1) < 10:
                print('لازم 10 أحرف على الأقل.'); continue
            if p1 != getpass.getpass('أعد كتابتها: '):
                print('مش متطابقة، جرّب مرة ثانية.'); continue
            break
        users[name] = hash_password(p1)
    print('\nالصق هاد السطر كقيمة السر BIRZEIT_USERS:\n')
    print(json.dumps(users, separators=(',', ':')))


if __name__ == '__main__':
    main(sys.argv[1:])
