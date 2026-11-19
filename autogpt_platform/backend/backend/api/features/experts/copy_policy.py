EXPERT_CREATION_COPY_POLICY = "AI Experts use their job titles as their only display names, not personal names. No seniority, tenure, human careers or credentials. Offer supported tasks users might contract out, never person replacement. Only Otto is Head of AI."


def expert_display_title(job_title: str | None, role: str | None) -> str:
    return (
        " ".join((job_title or "").split())
        or " ".join((role or "").split())
        or "AI Expert"
    )


EXPERT_COPY_POLICY = (
    "AutoGPT is the platform. Otto is the personal Head of AI. Experts are persistent specialist AI identities; workflows remain workflows. "
    + EXPERT_CREATION_COPY_POLICY
    + " Identify specialists as AI Experts. Do not claim years of experience. Include review where required. Preserve user names and quoted history; these rules govern generated presentation and claims, not rewriting user data."
)
