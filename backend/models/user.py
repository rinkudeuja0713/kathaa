# User model with mentor fields
class User:
    def __init__(self, id, email, role='user', is_mentor=False, is_verified_mentor=False, mentor_specializations=None, mentor_bio=""):
        self.id = id
        self.email = email
        self.role = role
        self.is_mentor = is_mentor
        self.is_verified_mentor = is_verified_mentor
        self.mentor_specializations = mentor_specializations or []
        self.mentor_bio = mentor_bio