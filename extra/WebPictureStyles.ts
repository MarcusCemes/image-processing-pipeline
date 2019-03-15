import createStyles from '@material-ui/core/styles/createStyles';
import { Theme } from '@material-ui/core/styles/createMuiTheme';

export const styles = (theme: Theme) => createStyles({
  picture: {
    display: 'inline'
  },
  preview: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    filter: 'blur(10px)',
    transform: 'scale(1.05)',
    transition: 'all 200ms ease-out',
  },
  fade: {
    opacity: 0,
    transform: 'none'
  },
  failedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: '#FFF',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  failedOverlayText: {
    marginTop: '16px',
    color: '#AAA',
    fontSize: '14px'
  }
});