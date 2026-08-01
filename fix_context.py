import re

with open('src/context.tsx', 'r') as f:
    content = f.read()

# Fix interface
content = re.sub(
    r"recordingAnnouncementToast,\n\s*huddleLogs,\n\s*setHuddleLogs: string \| null;",
    "recordingAnnouncementToast: string | null;",
    content
)

# Fix useState
content = re.sub(
    r"const \[recordingAnnouncementToast,\n\s*huddleLogs,\n\s*setHuddleLogs, setRecordingAnnouncementToast\] = useState<string \| null>\(null\);",
    "const [recordingAnnouncementToast, setRecordingAnnouncementToast] = useState<string | null>(null);",
    content
)

with open('src/context.tsx', 'w') as f:
    f.write(content)
