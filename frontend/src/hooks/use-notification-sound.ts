"use client"

import * as React from "react"

let audioContext: AudioContext | null = null

export function useNotificationSound() {
  const play = React.useCallback(async () => {
    if (typeof window === 'undefined') return

    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      if (audioContext.state === 'suspended') {
        // Will only work if triggered by user interaction, but handles subsequent plays
        await audioContext.resume()
      }

      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime) // A5
      oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.1) // A4

      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (error) {
      console.error("Failed to play notification sound", error)
    }
  }, [])

  return { play }
}
