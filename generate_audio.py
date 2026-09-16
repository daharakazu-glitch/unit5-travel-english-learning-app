import asyncio
import os
import edge_tts

# Audio directory
AUDIO_DIR = "/Users/kazuyukiharada/.gemini/antigravity-ide/scratch/unit5-travel-english-learning-app/audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

# Voices:
# Jenny: Friendly and natural female newscaster (en-US-JennyNeural)
# Guy: Deep, professional male for university president (en-US-GuyNeural)
# Aria: Expressive female parent (en-US-AriaNeural)
# Ava: Natural young female student (en-US-AvaNeural)

NEWSCASTER_VOICE = "en-US-JennyNeural"
PRESIDENT_VOICE = "en-US-GuyNeural"
PARENT_VOICE = "en-US-AriaNeural"
STUDENT_VOICE = "en-US-AvaNeural"

AUDIO_ITEMS = [
    # Listening 2 Part 1 Sentences
    {
        "filename": "l2p1_full.mp3",
        "voice": NEWSCASTER_VOICE,
        "text": "Gap-year scheme launched by another Japanese university. Toyoda University of International Studies is launching a gap-year program for its undergraduate students from the next academic year. Gap years have been popular in countries such as Australia and the UK for many years but have struggled to catch on in Japan to date. However, at a press conference called this week to announce the new program, the university president was confident that the time is right to offer gap years to Japanese young people. We think that the benefits of gap years are obvious. They will allow our undergraduates to experience the world outside of education, build up their independence, and give them a more rounded sense of themselves. Evidence from other countries shows that students who take a gap year tend to be more mature, independent, and self-motivated than those who go straight from school to university. Japanese students who wish to use their gap year to study abroad will also develop their language skills and broaden their horizons. We hope and expect that many students will take up the offer."
    },
    {
        "filename": "l2p1_s1.mp3",
        "voice": NEWSCASTER_VOICE,
        "text": "Gap-year scheme launched by another Japanese university."
    },
    {
        "filename": "l2p1_s2.mp3",
        "voice": NEWSCASTER_VOICE,
        "text": "Toyoda University of International Studies is launching a gap-year program for its undergraduate students from the next academic year."
    },
    {
        "filename": "l2p1_s3.mp3",
        "voice": NEWSCASTER_VOICE,
        "text": "Gap years have been popular in countries such as Australia and the UK for many years but have struggled to catch on in Japan to date."
    },
    {
        "filename": "l2p1_s4.mp3",
        "voice": NEWSCASTER_VOICE,
        "text": "However, at a press conference called this week to announce the new program, the university president was confident that the time is right to offer gap years to Japanese young people."
    },
    {
        "filename": "l2p1_s5.mp3",
        "voice": PRESIDENT_VOICE,
        "text": "We think that the benefits of gap years are obvious."
    },
    {
        "filename": "l2p1_s6.mp3",
        "voice": PRESIDENT_VOICE,
        "text": "They will allow our undergraduates to experience the world outside of education, build up their independence, and give them a more rounded sense of themselves."
    },
    {
        "filename": "l2p1_s7.mp3",
        "voice": PRESIDENT_VOICE,
        "text": "Evidence from other countries shows that students who take a gap year tend to be more mature, independent, and self-motivated than those who go straight from school to university."
    },
    {
        "filename": "l2p1_s8.mp3",
        "voice": PRESIDENT_VOICE,
        "text": "Japanese students who wish to use their gap year to study abroad will also develop their language skills and broaden their horizons."
    },
    {
        "filename": "l2p1_s9.mp3",
        "voice": PRESIDENT_VOICE,
        "text": "We hope and expect that many students will take up the offer."
    },
    
    # Listening 2 Part 2 Sentences
    {
        "filename": "l2p2_full.mp3",
        "voice": NEWSCASTER_VOICE,
        "text": "Parents and students that we talked to at a recent open day at the university had mixed responses to the initiative. Personally, I don't want my daughter traveling the world. I know her and I worry that she will lose focus and become lazy. I am also worried about her chances of getting a job after university if she takes a gap year. I think this is a great idea. I am mentally exhausted from studying for university exams. I think that having new experiences and a change of scenery would allow me to rebuild my energy and enthusiasm. After that, I will be ready for studying again."
    },
    {
        "filename": "l2p2_s1.mp3",
        "voice": NEWSCASTER_VOICE,
        "text": "Parents and students that we talked to at a recent open day at the university had mixed responses to the initiative."
    },
    {
        "filename": "l2p2_s2.mp3",
        "voice": PARENT_VOICE,
        "text": "Personally, I don't want my daughter traveling the world."
    },
    {
        "filename": "l2p2_s3.mp3",
        "voice": PARENT_VOICE,
        "text": "I know her and I worry that she will lose focus and become lazy."
    },
    {
        "filename": "l2p2_s4.mp3",
        "voice": PARENT_VOICE,
        "text": "I am also worried about her chances of getting a job after university if she takes a gap year."
    },
    {
        "filename": "l2p2_s5.mp3",
        "voice": STUDENT_VOICE,
        "text": "I think this is a great idea."
    },
    {
        "filename": "l2p2_s6.mp3",
        "voice": STUDENT_VOICE,
        "text": "I am mentally exhausted from studying for university exams."
    },
    {
        "filename": "l2p2_s7.mp3",
        "voice": STUDENT_VOICE,
        "text": "I think that having new experiences and a change of scenery would allow me to rebuild my energy and enthusiasm."
    },
    {
        "filename": "l2p2_s8.mp3",
        "voice": STUDENT_VOICE,
        "text": "After that, I will be ready for studying again."
    }
]

async def main():
    print(f"Generating {len(AUDIO_ITEMS)} natural native audio files with Edge Neural TTS...")
    for item in AUDIO_ITEMS:
        out_path = os.path.join(AUDIO_DIR, item["filename"])
        communicate = edge_tts.Communicate(item["text"], item["voice"], rate="+0%")
        await communicate.save(out_path)
        print(f"Generated: {item['filename']} with voice {item['voice']}")
    print("All audio files generated successfully!")

if __name__ == "__main__":
    asyncio.run(main())
