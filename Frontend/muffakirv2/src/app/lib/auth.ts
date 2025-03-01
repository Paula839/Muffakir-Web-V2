export const getCurrentUser = async () => {
    try {
      const response = await fetch('/me', { credentials: 'include' });
      return response.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return null;
    }
  };
  