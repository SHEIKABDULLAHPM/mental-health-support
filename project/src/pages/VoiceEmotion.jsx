// VoiceEmotion page component
import VoiceEmotionDetector from '../components/VoiceEmotion/VoiceEmotionDetector';

const VoiceEmotion = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <VoiceEmotionDetector />
    </div>
  );
};

export default VoiceEmotion;
