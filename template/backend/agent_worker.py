import logging
import os

from dotenv import load_dotenv

from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    RoomOutputOptions,
    WorkerOptions,
    WorkerType,
    cli,
)
from livekit.plugins import hedra, openai

logger = logging.getLogger("hedra-avatar-example")
logger.setLevel(logging.INFO)

if os.path.exists(".env.local"):
    load_dotenv(dotenv_path=".env.local")
else:
    load_dotenv()

async def entrypoint(ctx: JobContext):
    await ctx.connect()

    session = AgentSession(
        llm=openai.realtime.RealtimeModel(voice="alloy"),
    )

    avatar_id = os.getenv("HEDRA_AVATAR_ID")
    hedra_avatar = hedra.AvatarSession(avatar_id=avatar_id)
    await hedra_avatar.start(session, room=ctx.room)

    await session.start(
        agent=Agent(instructions="Talk to me!"),
        room=ctx.room,
        # audio is forwarded to the avatar, so we disable room audio output
        room_output_options=RoomOutputOptions(audio_enabled=False),
    )


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, worker_type=WorkerType.ROOM))
