from enum import StrEnum


class UserRole(StrEnum):
    LEARNER = "learner"
    TESTER = "tester"
    TRAINER = "trainer"
    ADMIN = "admin"


SUPPORTED_ROLES = frozenset(role.value for role in UserRole)
CONTENT_MANAGER_ROLES = (UserRole.TRAINER.value, UserRole.ADMIN.value)