import { useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { BOARD_THEMES } from '@/utils/themeConfig';
import styles from './ChessBoardCustom.module.scss';

const ChessBoardCustom = (props) => {
  const theme = localStorage.getItem('boardTheme') || 'brown';
  const themeColors = BOARD_THEMES[theme];

  const chessboardOptions = useMemo(() => {
    const { customBoardStyle, ...restProps } = props;
    return {
      ...restProps,
      lightSquareStyle: { backgroundColor: themeColors.white },
      darkSquareStyle: { backgroundColor: themeColors.black },
      customBoardStyle: {
        borderRadius: '4px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
        ...customBoardStyle,
      },
    };
  }, [props, themeColors]);

  return (
    <div className={styles.boardWrapper}>
      <Chessboard options={chessboardOptions} />
    </div>
  );
};

export default ChessBoardCustom;
