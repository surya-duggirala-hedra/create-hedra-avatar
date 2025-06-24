# Prerequisites
TODO(ENG-4482)

# Install and Start Realtime Avatar
```
$ npx create-hedra-avatar <app-name>
$ cd <app-name>
$ npm run start-app
$ npm run start-agent # in a new terminal
```

# Additional Notes
You can change the avatar that is speaking by adding assets to `backend/assets` and then updated `backend/agent_worker.py` to point to the relevant image file.