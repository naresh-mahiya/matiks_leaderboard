const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

export const fetchLeaderboard = async (limit = 50, offset = 0) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/leaderboard?limit=${limit}&offset=${offset}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};

export const searchUsers = async (query) => {
  try {
    if (!query || query.trim() === '') {
      return { users: [], query: '' };
    }

    const response = await fetch(
      `${API_BASE_URL}/search?query=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error('Failed to search users');
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

export const simulateGameplay = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/simulate`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to simulate gameplay');
    }

    return await response.json();
  } catch (error) {
    console.error('Error simulating gameplay:', error);
    throw error;
  }
};
