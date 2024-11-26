import CloseIcon from '@mui/icons-material/Close';

interface CloseButtonProps {
  onClick: () => void;
  className?: string;
}

const CloseButton = ({ onClick, className = '' }: CloseButtonProps) => {
  return (
    <button
      className={`text-gray-400 hover:text-white transition-colors ${className}`}
      onClick={onClick}
    >
      <CloseIcon fontSize="small" />
    </button>
  );
};

export default CloseButton;
