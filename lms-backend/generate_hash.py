from utils.auth import hash_password

password = "Admin@lms123"

hashed_password = hash_password(password)

print(hashed_password)