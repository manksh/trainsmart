"""
Coaching tips service.

Provides static coaching tips data for all 10 pillars.
Tips are categorized as either "strength" or "growth" based on assessment scores,
with separate recommendations for practice and game day scenarios.
"""

from typing import Dict
from pydantic import BaseModel


class CoachingTip(BaseModel):
    """A coaching tip with practice and game day recommendations."""
    practice: str
    game_day: str


class PillarTips(BaseModel):
    """Complete tips for a single pillar."""
    pillar: str
    display_name: str
    strength_tips: CoachingTip
    growth_tips: CoachingTip


# Thresholds for tip classification based on 1-7 Likert scale
COACHING_TIP_THRESHOLDS = {
    "strength": 5.5,  # Score >= 5.5 indicates a strength
    "growth": 3.5,    # Score <= 3.5 indicates growth area
}


# All 10 pillars with coaching tips
# 6 Core Competencies + 4 Supporting Attributes
COACHING_TIPS_DATA: Dict[str, PillarTips] = {
    # --- CORE COMPETENCIES (6) ---
    "arousal_control": PillarTips(
        pillar="arousal_control",
        display_name="Arousal Control",
        strength_tips=CoachingTip(
            practice="Create pressure scenarios that challenge them to stay in their optimal zone, then debrief what techniques they used successfully.",
            game_day="Give them ownership over their pre-competition routine and check in briefly to confirm they're at their ideal activation level."
        ),
        growth_tips=CoachingTip(
            practice="Build a personalized arousal toolkit together (breathing techniques, music, self-talk) and schedule specific moments in practice to experiment.",
            game_day="Establish a simple check-in signal (1-10 scale) so they can communicate their arousal level and you can offer targeted reminders."
        )
    ),
    "attentional_focus": PillarTips(
        pillar="attentional_focus",
        display_name="Attentional Focus",
        strength_tips=CoachingTip(
            practice="Challenge them with increasing distractions during drills and ask them to articulate their focus cues afterward.",
            game_day="Keep instructions minimal and trust their ability to self-manage focus—a simple reminder of one key focus cue is effective."
        ),
        growth_tips=CoachingTip(
            practice="Work together to identify 2-3 specific focus cues for key moments, then deliberately practice refocusing after planned distractions.",
            game_day="Provide a clear, consistent refocusing routine (deep breath + reset word) they can use between plays when attention drifts."
        )
    ),
    "confidence": PillarTips(
        pillar="confidence",
        display_name="Confidence",
        strength_tips=CoachingTip(
            practice="Let them lead warm-ups or demonstrate skills to teammates—their confidence can elevate others.",
            game_day="Acknowledge their readiness briefly without over-coaching; they likely have their own mental preparation that works."
        ),
        growth_tips=CoachingTip(
            practice="Help them create a personal highlight reel (mental or actual video) of past successes to review regularly before competition.",
            game_day="Use specific, evidence-based encouragement ('You've made this play 100 times') rather than generic praise."
        )
    ),
    "mindfulness": PillarTips(
        pillar="mindfulness",
        display_name="Mindfulness",
        strength_tips=CoachingTip(
            practice="Use them as a model for staying composed under pressure—ask them to share their approach with teammates.",
            game_day="Trust their ability to stay present; brief eye contact or a nod may be all the connection they need."
        ),
        growth_tips=CoachingTip(
            practice="Introduce brief mindfulness exercises (30-60 seconds) at practice transitions to build the habit in a low-stakes environment.",
            game_day="Provide a simple grounding technique (feel your feet, take one breath) they can use when they notice their mind racing."
        )
    ),
    "motivation": PillarTips(
        pillar="motivation",
        display_name="Motivation",
        strength_tips=CoachingTip(
            practice="Channel their drive by giving them ownership of specific team goals or mentoring roles with younger athletes.",
            game_day="Connect the competition to their personal goals—remind them why this matters to them specifically."
        ),
        growth_tips=CoachingTip(
            practice="Help them identify intrinsic motivators beyond external rewards and set small, achievable process goals for each practice.",
            game_day="Break the competition into smaller segments with immediate, controllable focus points to maintain engagement."
        )
    ),
    "resilience": PillarTips(
        pillar="resilience",
        display_name="Resilience",
        strength_tips=CoachingTip(
            practice="Put them in high-challenge situations and debrief how they maintained composure—use their strategies as teaching moments.",
            game_day="After setbacks, give them space to reset on their own timeline rather than rushing intervention."
        ),
        growth_tips=CoachingTip(
            practice="Create safe opportunities to experience and recover from failure, then discuss specific bounce-back strategies together.",
            game_day="Have a pre-planned reset routine ready (physical movement + verbal cue) and practice it so it feels automatic under pressure."
        )
    ),
    # --- SUPPORTING ATTRIBUTES (4) ---
    "deliberate_practice": PillarTips(
        pillar="deliberate_practice",
        display_name="Deliberate Practice",
        strength_tips=CoachingTip(
            practice="Give them autonomy in designing portions of their training—they understand how to push their growth edges effectively.",
            game_day="Trust their preparation and avoid last-minute technical changes; their practice quality means they're ready."
        ),
        growth_tips=CoachingTip(
            practice="Help them set specific, measurable practice goals each session and track progress to make training feel more purposeful.",
            game_day="Before competition, briefly review one or two key skills they've been working on to connect practice to performance."
        )
    ),
    "knowledge": PillarTips(
        pillar="knowledge",
        display_name="Knowledge",
        strength_tips=CoachingTip(
            practice="Engage them in tactical discussions and ask for their input on game plans—their understanding can benefit the whole team.",
            game_day="Trust their ability to make in-game adjustments and read situations; they have the mental framework to adapt."
        ),
        growth_tips=CoachingTip(
            practice="Provide brief, focused explanations of the 'why' behind drills and tactics to build their mental model of the sport.",
            game_day="Give clear, specific instructions rather than complex explanations—keep tactical information simple and actionable."
        )
    ),
    "wellness": PillarTips(
        pillar="wellness",
        display_name="Wellness",
        strength_tips=CoachingTip(
            practice="Recognize their healthy habits publicly and ask them to share what works—they can model recovery and self-care for teammates.",
            game_day="Trust their judgment on their physical state; they likely have good awareness of when they need rest versus when to push."
        ),
        growth_tips=CoachingTip(
            practice="Check in regularly on sleep, nutrition, and stress levels; help them see the connection between wellness and performance.",
            game_day="Watch for signs of fatigue or unusual behavior and be ready to adjust expectations or playing time accordingly."
        )
    ),
    "self_awareness": PillarTips(
        pillar="self_awareness",
        display_name="Self-Awareness",
        strength_tips=CoachingTip(
            practice="Ask them to self-evaluate before you provide feedback—their accuracy can guide more efficient coaching conversations.",
            game_day="Encourage them to trust their self-read on readiness and make adjustments based on their own assessment."
        ),
        growth_tips=CoachingTip(
            practice="Use video review or journaling prompts to help them notice patterns in their performance and emotional responses.",
            game_day="Provide specific, observable feedback during breaks to help them calibrate their self-perception with external reality."
        )
    ),
}
