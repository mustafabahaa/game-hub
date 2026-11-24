import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  MobileBottomNavigationAction,
  MobileBottomNavigationItem,
  MobileBottomNavigationShape,
  MobileBottomNavigationShell,
} from '@monochrome-ui/design-system';
import { AddIcon, GamepadIcon, ShopIcon } from '@/components/AppIcon';

function notchPath(width: number, height: number) {
  const center = width / 2;
  const left = center - 48;
  const right = center + 48;
  return [
    `M -2,-2 L ${left},0`,
    `C ${left + 20},0 ${center - 20},34 ${center},34`,
    `C ${center + 20},34 ${right - 20},0 ${right},0`,
    `L ${width + 2},0 L ${width + 2},${height + 2} L -2,${height + 2} Z`,
  ].join(' ');
}

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const dockRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const providersActive = pathname === '/providers' || pathname.startsWith('/providers/');
  const addingAccount = pathname === '/' && new URLSearchParams(search).get('action') === 'add-account';

  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    const observer = new ResizeObserver(() => {
      const { width, height } = dock.getBoundingClientRect();
      setSize({ width, height });
    });
    observer.observe(dock);
    return () => observer.disconnect();
  }, []);

  return (
    <MobileBottomNavigationShell ref={dockRef} component="nav" aria-label="Main navigation">
      {size.width > 0 && (
        <MobileBottomNavigationShape width={size.width} height={size.height} path={notchPath(size.width, size.height)} />
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: 560, mx: 'auto', height: 52, gap: 0.5 }}>
        <MobileBottomNavigationItem active={!providersActive} label="Vault" icon={<GamepadIcon size={23} />}
          onClick={() => navigate('/')} />
        <MobileBottomNavigationAction active={addingAccount} onClick={() => navigate('/?action=add-account')}>
          <AddIcon size={30} />
        </MobileBottomNavigationAction>
        <MobileBottomNavigationItem active={providersActive} label="Providers" icon={<ShopIcon size={23} />}
          onClick={() => navigate('/providers')} />
      </Box>
    </MobileBottomNavigationShell>
  );
}
