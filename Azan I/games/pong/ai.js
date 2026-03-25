(function () {
  const profiles = {
    easy: { speed: 330, tracking: 0.08, launchSpeed: 310 },
    medium: { speed: 420, tracking: 0.11, launchSpeed: 360 },
    hard: { speed: 520, tracking: 0.145, launchSpeed: 420 },
  };

  window.PongAI = {
    getProfile(level) {
      return profiles[level] || profiles.medium;
    },
    updatePaddle(state, deltaSeconds, canvasHeight, paddleHeight) {
      const profile = this.getProfile(state.difficulty);
      const targetY = state.ball.y - paddleHeight / 2 + state.ball.vy * profile.tracking;
      const difference = targetY - state.ai.y;
      const step = Math.sign(difference) * Math.min(Math.abs(difference), profile.speed * deltaSeconds);
      state.ai.y = Math.max(0, Math.min(canvasHeight - paddleHeight, state.ai.y + step));
    },
  };
})();
