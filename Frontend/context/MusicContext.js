import React, { createContext, useEffect, useState } from "react";
import { Audio } from "expo-av";

export const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
  const [sound, setSound] = useState(null);

  // Phát nhạc khi mở app
  useEffect(() => {
    let isMounted = true;

    async function playMusic() {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require("../assets/music/background.mp3"), // đường dẫn tới file nhạc
          { shouldPlay: true, isLooping: true, volume: 0.3 } // tự động phát, lặp lại
        );

        if (isMounted) setSound(sound);
        await sound.playAsync();
      } catch (error) {
        console.error("Error playing music:", error);
      }
    }

    playMusic();

    return () => {
      isMounted = false;
      if (sound) {
        sound.unloadAsync(); // giải phóng tài nguyên khi tắt app
      }
    };
  }, []);

  return (
    <MusicContext.Provider value={{ sound }}>
      {children}
    </MusicContext.Provider>
  );
};
