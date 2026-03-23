const audioFiles = [
    'Beats.mp3',
    'Chill.mp3',
    'Classic Indian.mp3',
    'Curious.mp3',
    'Deep.mp3',
    'Emo Indian.mp3',
    'HipHop.mp3',
    'Indian Flute.mp3',
    'Indian.mp3',
    'LOFI1.mp3',
    'LOFI2.mp3',
    'Serene.mp3',
    'Trap.mp3',
    'Uplifting 2.mp3',
    'Uplifting.mp3',
    'Warm.mp3',
    'Waves 2.mp3',
    'Waves 3.mp3',
    'Waves 4.mp3',
    'Waves.mp3',
  ]
  
  function fileNameToTitle(fileName) {
    return fileName.replace(/\.[^/.]+$/, '').trim()
  }
  
  function inferType(fileName) {
    const lower = fileName.toLowerCase()
  
    if (lower.includes('lofi') || lower.includes('lo-fi')) return 'lofi'
    if (lower.includes('hiphop') || lower.includes('hip-hop') || lower.includes('trap')) return 'beats'
    if (lower.includes('serene') || lower.includes('warm') || lower.includes('chill') || lower.includes('deep')) return 'serene'
    if (lower.includes('waves')) return 'ambient'
    if (lower.includes('indian') || lower.includes('flute')) return 'indian'
    return 'focus'
  }
  
  export const tracks = audioFiles.map((fileName) => ({
    title: fileNameToTitle(fileName),
    artist: 'ROAR Beats',
    file: `/audio/${fileName}`,
    type: inferType(fileName),
  }))