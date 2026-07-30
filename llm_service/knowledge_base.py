"""Enhanced fallback knowledge base with categorized mental health content."""

from __future__ import annotations

KNOWLEDGE_DOCUMENTS: list[str] = []

KNOWLEDGE_METADATA: list[dict] = []

CATEGORIZED_DOCS: dict[str, list[str]] = {
    "anxiety": [
        "Anxiety is a natural response to perceived threats. The fight-or-flight response prepares your body for action. When anxiety becomes chronic, it can interfere with daily life and indicate an anxiety disorder.",
        "Generalized Anxiety Disorder (GAD) involves excessive worry about everyday things. Physical symptoms include restlessness, fatigue, muscle tension, and sleep disturbances. CBT is an effective treatment for GAD.",
        "Panic attacks are sudden episodes of intense fear with physical symptoms like heart palpitations, sweating, trembling, and feeling of choking. Panic attacks typically peak within 10 minutes and can be managed with breathing techniques.",
        "Social anxiety involves intense fear of social situations where you might be judged. It can be managed through gradual exposure, cognitive restructuring, and social skills training.",
        "Obsessive-Compulsive Disorder (OCD) involves unwanted, intrusive thoughts (obsessions) and repetitive behaviors (compulsions). ERP (Exposure and Response Prevention) therapy is the gold-standard treatment.",
        "Post-Traumatic Stress Disorder (PTSD) develops after experiencing a traumatic event. Symptoms include flashbacks, nightmares, hypervigilance, and avoidance. Evidence-based treatments include CBT, EMDR, and medication.",
        "The cognitive model of anxiety suggests that anxious thoughts drive anxious feelings and behaviors. Identifying and challenging these thoughts can reduce anxiety. Common cognitive distortions include catastrophizing and overgeneralization.",
        "Grounding techniques for anxiety: The 5-4-3-2-1 technique engages your senses to bring you to the present moment. Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste.",
        "Breathing exercises for anxiety: Box breathing (4-4-4-4) involves inhaling for 4 counts, holding for 4, exhaling for 4, and holding for 4. This activates the parasympathetic nervous system and promotes calm.",
        "The worry window technique: Set aside 15 minutes daily as 'worry time'. When worries arise outside this time, write them down and return to them during worry time. This helps contain rumination.",
    ],
    "depression": [
        "Depression is a common but serious mood disorder. It affects how you feel, think, and handle daily activities. Symptoms include persistent sadness, loss of interest, changes in appetite, sleep disturbances, and fatigue.",
        "Major Depressive Disorder (MDD) requires 5+ symptoms over 2+ weeks, including depressed mood or loss of interest. Treatment typically involves therapy, medication, or a combination. CBT and interpersonal therapy are effective.",
        "Behavioral activation is a core CBT technique for depression. It involves scheduling positive activities and gradually increasing engagement. Even small activities like going for a walk can improve mood.",
        "Cognitive distortions in depression include all-or-nothing thinking, mental filtering, and personalization. Recognizing and challenging these patterns is a key part of CBT for depression.",
        "The rumination cycle: Constantly dwelling on negative thoughts maintains depression. Strategies to break the cycle include distraction, problem-solving, mindfulness, and scheduling worry time.",
        "Physical activity has been shown to be as effective as medication for mild to moderate depression. Aim for 30 minutes of moderate exercise most days. Even short walks provide benefits.",
        "Sleep and depression are closely linked. Depression can cause insomnia, and poor sleep can worsen depression. Maintaining consistent sleep habits is crucial for recovery.",
        "Perinatal depression affects women during pregnancy and after childbirth. It's more than 'baby blues' and requires treatment. Symptoms include severe mood swings, crying, and difficulty bonding with the baby.",
    ],
    "stress": [
        "Stress is the body's response to demands or pressures. Acute stress is short-term and can be motivating. Chronic stress persists over time and can harm physical and mental health.",
        "The stress response involves the hypothalamic-pituitary-adrenal (HPA) axis. When activated, cortisol is released. Chronic elevation of cortisol can lead to health problems including anxiety, depression, and cardiovascular issues.",
        "Workplace stress is a leading source of chronic stress. Common causes include heavy workloads, lack of control, poor work relationships, and job insecurity. Setting boundaries and taking breaks are essential coping strategies.",
        "Progressive Muscle Relaxation (PMR) involves tensing and releasing muscle groups sequentially. Start with your feet, hold tension for 5 seconds, then release. This reduces physical tension and promotes relaxation.",
        "Stress management techniques include: time management, setting priorities, delegating tasks, saying no when needed, maintaining social connections, physical activity, adequate sleep, and healthy eating.",
        "The stress bucket analogy: Everyone has a 'stress bucket' that fills with daily stressors. You need 'drainage holes' (coping strategies) to prevent overflow. Common outlets include exercise, hobbies, and talking to friends.",
        "Journaling for stress: Write about your thoughts and feelings for 10-15 minutes daily. This can help process emotions, identify patterns, and gain perspective on stressful situations.",
        "Burnout is a state of emotional, physical, and mental exhaustion caused by prolonged stress. Signs include cynicism, reduced performance, and detachment. Recovery requires rest, boundary setting, and often professional support.",
    ],
    "mindfulness": [
        "Mindfulness is paying attention to the present moment intentionally and without judgment. It involves observing thoughts, feelings, and sensations as they arise, without trying to change them.",
        "Mindfulness-Based Stress Reduction (MBSR) is an 8-week program combining mindfulness meditation, body awareness, and yoga. It has strong evidence for reducing stress, anxiety, and chronic pain.",
        "Formal mindfulness practice involves setting aside time for meditation. Start with 5-10 minutes daily. Sit comfortably, focus on your breath, and gently return attention when the mind wanders.",
        "Mindful breathing is the foundation of many meditation practices. Focus on the sensation of breath entering and leaving your body. When thoughts arise, acknowledge them and return to the breath.",
        "The body scan meditation involves bringing attention to each part of your body sequentially. This develops body awareness and helps release physical tension held in different areas.",
        "Loving-kindness meditation (metta) cultivates feelings of goodwill toward yourself and others. Begin with yourself, then extend to loved ones, neutral people, difficult people, and all beings.",
        "Mindfulness can be practiced informally throughout the day: mindful eating, mindful walking, mindful listening. These bring present-moment awareness to daily activities.",
        "The STOP technique: Stop what you're doing, Take a breath, Observe your thoughts and feelings, Proceed with intention. This interrupts automatic reactions and creates space for choice.",
        "Cognitive defusion is noticing thoughts without getting caught in them. Instead of 'I am anxious', try 'I notice I'm having the thought that I am anxious'. This creates distance between you and your thoughts.",
        "Acceptance in mindfulness means allowing experiences to be as they are without fighting them. Paradoxically, accepting difficult emotions often reduces their intensity and duration.",
    ],
    "sleep": [
        "Sleep is essential for physical and mental health. During sleep, the brain processes emotions, consolidates memories, and clears metabolic waste. Chronic sleep deprivation increases risk of anxiety, depression, and health problems.",
        "Sleep hygiene includes: consistent sleep schedule, relaxing bedtime routine, cool/dark bedroom, avoiding screens 1 hour before bed, limiting caffeine after noon, avoiding heavy meals before bedtime, and regular exercise.",
        "Insomnia involves difficulty falling asleep, staying asleep, or waking too early. CBT for Insomnia (CBT-I) is the first-line treatment and addresses thoughts and behaviors that interfere with sleep.",
        "The 20-minute rule for insomnia: If you can't sleep after 20 minutes, get out of bed and do something relaxing in dim light. Return to bed only when sleepy. This prevents associating bed with wakefulness.",
        "Circadian rhythms are internal biological clocks that regulate sleep-wake cycles. Morning sunlight exposure, consistent meal times, and regular exercise help maintain healthy rhythms.",
        "Sleep and mental health are bidirectional: poor sleep worsens mental health, and mental health issues disrupt sleep. Treating both simultaneously leads to better outcomes.",
        "Napping: Short naps (10-20 minutes) can improve alertness. Longer naps can cause sleep inertia. Avoid napping after 3 PM to protect nighttime sleep.",
    ],
    "emotions": [
        "Emotions are complex psychological and physiological responses to stimuli. They involve subjective feelings, bodily changes, and behavioral urges. All emotions serve adaptive functions.",
        "Emotional regulation involves awareness, understanding, and management of emotions. Key skills: identifying emotions, reducing vulnerability, increasing positive events, and changing unhelpful responses.",
        "DBT (Dialectical Behavior Therapy) teaches emotional regulation skills. Core skills include: mindfulness, distress tolerance, interpersonal effectiveness, and emotion regulation. DBT is especially effective for intense emotions.",
        "The emotional mind, reasonable mind, and wise mind framework from DBT: Wise mind integrates emotional and reasonable thinking, leading to balanced decisions and responses.",
        "Suppressing emotions can backfire and intensify them. Healthier approaches include acknowledging emotions, expressing them appropriately, and using coping strategies to modulate their intensity.",
        "Grief is a natural response to loss. It is not linear; people move through stages differently. Common experiences include denial, anger, bargaining, depression, and acceptance. There is no 'correct' timeline for grief.",
        "Anger is a normal emotion that signals perceived injustice or boundary violations. Healthy anger expression involves communicating needs clearly without aggression. Suppressed anger can lead to resentment and health problems.",
        "Emotional intelligence (EQ) involves recognizing your own emotions, managing them, recognizing others' emotions, and handling relationships. EQ can be developed through practice and reflection.",
    ],
    "relationships": [
        "Healthy relationships are built on trust, respect, communication, and boundaries. They contribute significantly to mental health and well-being. Unhealthy relationships can be a source of stress and emotional distress.",
        "Effective communication in relationships involves: active listening, using 'I' statements, expressing needs clearly, validating others' feelings, and avoiding blame. These skills improve relationship satisfaction.",
        "Setting boundaries is essential for healthy relationships. Boundaries define what behavior you accept and what you don't. They should be clear, consistent, and communicated respectfully.",
        "Attachment theory describes how early relationships with caregivers shape adult relationship patterns. Secure attachment involves comfort with intimacy and independence. Insecure patterns can be changed through awareness and effort.",
        "Conflict resolution in relationships: Focus on the issue, not the person. Use 'I' statements. Listen to understand, not to respond. Find common ground. Take breaks if emotions are high. Seek compromise.",
        "Codependency involves excessive emotional or psychological reliance on a partner. Signs include putting others' needs before your own, difficulty saying no, and low self-worth. Recovery involves boundary setting and self-care.",
        "Social support is a powerful protective factor for mental health. Strong social connections reduce stress, improve mood, and increase resilience. Invest time in meaningful relationships.",
    ],
    "crisis": [
        "If you are having thoughts of suicide or self-harm, please call or text 988 (in the US) or your local crisis line immediately. You are not alone, and help is available 24/7.",
        "Crisis lines provide immediate, confidential support. They are staffed by trained counselors who can help you through difficult moments. Save your local crisis number in your phone.",
        "Warning signs of suicide include: talking about wanting to die, seeking methods, hopelessness, withdrawal, mood changes, and giving away possessions. Take all warning signs seriously.",
        "If someone tells you they are considering suicide: stay calm, listen without judgment, take them seriously, express concern, ask directly about suicide, remove means, and stay with them until they get help.",
        "Self-harm (non-suicidal self-injury) is often a coping mechanism for overwhelming emotions. It provides temporary relief but creates additional problems. Help is available through therapy and crisis support.",
        "After a crisis, safety planning is important. A safety plan includes: warning signs, internal coping strategies, people who can help, professional resources, and making the environment safe.",
        "Emotional crisis can feel overwhelming but is temporary. Grounding techniques, deep breathing, and reaching out for support can help you through the most intense moments. You can get through this.",
    ],
    "self_care": [
        "Self-care is any intentional action taken to maintain or improve your physical, mental, or emotional health. It is not selfish; it is necessary for well-being and sustainable functioning.",
        "Physical self-care includes: adequate sleep, nutritious food, regular exercise, hydration, and regular medical check-ups. Physical health directly impacts mental health and emotional resilience.",
        "Emotional self-care involves: acknowledging your feelings, setting boundaries, practicing self-compassion, engaging in activities you enjoy, and seeking support when needed.",
        "Social self-care: nurture relationships with supportive people, spend time with loved ones, join groups with shared interests, and reach out when you need connection.",
        "Professional self-care: set boundaries around work hours, take breaks, pursue professional development, maintain work-life balance, and seek supervision or support as needed.",
        "Self-compassion has three components: self-kindness vs self-judgment, common humanity vs isolation, and mindfulness vs over-identification. Practice treating yourself like you would treat a good friend.",
        "The value of hobbies and interests: Engaging in activities purely for enjoyment provides a sense of accomplishment, reduces stress, and creates balance in life. Make time for things you love.",
        "Gratitude practice: Regularly acknowledging things you're grateful for can shift focus from negative to positive. Try writing 3 things you're grateful for each day. This improves mood and well-being.",
        "Digital self-care: Set boundaries with technology, take breaks from social media, avoid screens before bed, curate your online environment positively, and use technology intentionally.",
        "Recovery is a journey, not a destination. Progress is rarely linear. Setbacks are normal and part of the process. Celebrate small victories and practice patience with yourself.",
    ],
    "faq": [
        "Q: What is the difference between a psychologist and a psychiatrist? A: Psychologists provide therapy and counseling. Psychiatrists are medical doctors who can prescribe medication. Both treat mental health conditions.",
        "Q: How long does therapy take? A: Therapy duration varies. Some people benefit from 6-12 sessions for specific issues. Others may engage in longer-term therapy. Progress depends on the issue, therapeutic relationship, and consistency.",
        "Q: Is medication necessary for mental health treatment? A: Not always. Many conditions improve with therapy alone. Medication can be helpful for moderate to severe conditions. The decision is made with a psychiatrist based on individual needs.",
        "Q: Can mental health conditions be cured? A: Many mental health conditions are manageable rather than 'cured'. With proper treatment, most people experience significant improvement and can lead fulfilling lives.",
        "Q: How do I find a therapist? A: Options include: insurance provider directories, online therapy platforms, employee assistance programs, community mental health centers, and recommendations from your primary care provider.",
        "Q: What should I expect in my first therapy session? A: The therapist will ask about your reasons for seeking therapy, personal history, current symptoms, and goals. It's also a chance to see if the therapist is a good fit for you.",
        "Q: How does CBT work? A: Cognitive Behavioral Therapy focuses on the relationship between thoughts, feelings, and behaviors. You learn to identify and change unhelpful thinking patterns and behaviors that maintain mental health issues.",
        "Q: Is online therapy effective? A: Yes, research shows online therapy is generally as effective as in-person therapy for many conditions. It offers convenience and accessibility, though some people prefer in-person connection.",
    ],
}


def _flatten() -> tuple[list[str], list[dict]]:
    texts = []
    meta = []
    for cat, docs in CATEGORIZED_DOCS.items():
        for i, doc in enumerate(docs):
            texts.append(doc)
            meta.append({"category": cat, "source": "clinical_knowledge_base", "type": "psychoeducation", "index": len(texts) - 1})
    return texts, meta


KNOWLEDGE_DOCUMENTS, KNOWLEDGE_METADATA = _flatten()


def get_knowledge_documents() -> list[str]:
    return KNOWLEDGE_DOCUMENTS


def get_knowledge_metadata() -> list[dict]:
    return KNOWLEDGE_METADATA