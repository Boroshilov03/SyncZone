export const negativeEmotions = [
    'Sadness',
    'Anger',
    'Fear',
    'Disgust',
    'Horror',
    'Surprise (negative)',
    'Anxiety',
    'Confusion',
    'Disappointment',
    'Distress',
    'Pain',
    'Shame',
    'Guilt',
    'Contempt',
    'Disapproval',
    'Awkwardness',
    'Doubt',
    'Annoyance',
    'Boredom',
    'Empathic Pain',
    'Embarrassment',
    'Envy',
    'Tiredness'
  ];
  
  export const isNegativeEmotion = (emotion) => {
    return negativeEmotions.includes(emotion);
  };