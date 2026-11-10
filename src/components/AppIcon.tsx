/* eslint-disable react-refresh/only-export-components -- Named exports are icon adapters for use as JSX, not components intended as separate HMR boundaries. */
import { forwardRef, type ComponentType, type ElementType } from 'react';
import { Box, SvgIcon, type SvgIconProps } from '@mui/material';
import {
  Add,
  AddSquare,
  ArrowDown,
  ArrowDown2,
  ArrowLeft,
  ArrowRight2,
  ArrowSwapHorizontal,
  ArrowUp,
  ArrowUp2,
  BackSquare,
  Backward,
  Bank,
  Briefcase,
  Calendar,
  Calendar1,
  Camera,
  Card,
  CardPos,
  Category,
  Chart,
  CloseCircle,
  CloudRemove,
  Convert,
  Copy,
  Discover,
  Danger,
  Edit2,
  Export,
  ExportSquare,
  Eye,
  EyeSlash,
  Facebook,
  Filter,
  Game,
  Global,
  Home2,
  HambergerMenu,
  Import,
  InfoCircle,
  Instagram,
  Key,
  Link1,
  Logout,
  Minus,
  Message2,
  MessageCircle,
  Messenger,
  MagicStar,
  Monitor,
  Sms,
  ShieldTick,
  More2,
  Moon,
  Note,
  Notification,
  NotificationBing,
  People,
  Profile2User,
  Receipt,
  SearchNormal1,
  Setting2,
  ShoppingCart,
  Sort,
  Shop,
  Send2,
  Star1,
  Sun,
  DocumentText,
  TickCircle,
  TickSquare,
  Timer1,
  Trash,
  Wallet,
  Whatsapp,
} from 'iconsax-react';

type IconsaxVariant = 'Linear' | 'Outline' | 'Broken' | 'Bold' | 'Bulk' | 'TwoTone';
type IconsaxComponent = ComponentType<{ color?: string; size?: string | number; variant?: IconsaxVariant }>;
type AppIconProps = SvgIconProps & { variant?: IconsaxVariant; size?: number | string };

const semanticIconColors: Partial<Record<NonNullable<SvgIconProps['color']>, string>> = {
  action: 'action.active',
  disabled: 'action.disabled',
  error: 'error.main',
  info: 'info.main',
  primary: 'primary.main',
  secondary: 'secondary.main',
  success: 'success.main',
  warning: 'warning.main',
};

/** MUI-compatible Iconsax adapter. Use these exports instead of direct icon-library imports. */
function createAppIcon(Icon: IconsaxComponent) {
  const IconBox = Box as ElementType;
  return forwardRef<SVGSVGElement, AppIconProps>(function AppIcon(
    { color = 'inherit', fontSize = 'medium', htmlColor, size, sx, variant = 'Linear', ...props },
    ref,
  ) {
    const fontSizeValue =
      size ?? (fontSize === 'small' ? 20 : fontSize === 'large' ? 35 : fontSize === 'inherit' ? 'inherit' : 24);
    const semanticColor = color === 'inherit' ? 'inherit' : semanticIconColors[color];
    return (
      <IconBox
        component={Icon as ElementType}
        ref={ref}
        variant={variant}
       
        size="1em"
        sx={[
          {
            color: htmlColor ?? semanticColor,
            display: 'block',
            flexShrink: 0,
            fontSize: fontSizeValue,
            width: '1em',
            height: '1em',
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...props}
      />
    );
  });
}

export const AcUnitIcon = createAppIcon(CloudRemove);
export const AccountBalanceIcon = createAppIcon(Bank);
export const AddIcon = createAppIcon(Add);
export const AddHomeIcon = createAppIcon(AddSquare);
export const ArrowBackIcon = createAppIcon(ArrowLeft);
export const ArrowDownIcon = createAppIcon(ArrowDown);
export const ArrowUpIcon = createAppIcon(ArrowUp);
export const ChevronRightIcon = createAppIcon(ArrowRight2);
export const BackspaceIcon = createAppIcon(BackSquare);
export const BarChartIcon = createAppIcon(Chart);
export const CalendarMonthIcon = createAppIcon(Calendar);
export const CalendarTodayIcon = createAppIcon(Calendar);
export const CancelIcon = createAppIcon(CloseCircle);
export const CategoryIcon = createAppIcon(Category);
export const CheckIcon = createAppIcon(TickSquare);
export const CheckCircleIcon = createAppIcon(TickCircle);
export const CheckCircleOutlineIcon = createAppIcon(TickCircle);
export const CloseIcon = createAppIcon(CloseCircle);
export const CloudOffIcon = createAppIcon(CloudRemove);
export const ContentCopyIcon = createAppIcon(Copy);
export const CreditCardIcon = createAppIcon(Card);
export const DarkModeIcon = createAppIcon(Moon);
export const DashboardIcon = createAppIcon(Category);
export const DeleteIcon = createAppIcon(Trash);
export const DeleteOutlineIcon = createAppIcon(Trash);
export const DocumentTextIcon = createAppIcon(DocumentText);
export const EditIcon = createAppIcon(Edit2);
export const EventIcon = createAppIcon(Calendar);
export const ExpandLessIcon = createAppIcon(ArrowUp2);
export const ExpandMoreIcon = createAppIcon(ArrowDown2);
export const ExploreIcon = createAppIcon(Discover);
export const GroupAddIcon = createAppIcon(People);
export const HistoryIcon = createAppIcon(Backward);
export const HomeIcon = createAppIcon(Home2);
export const HourglassEmptyIcon = createAppIcon(Timer1);
export const InfoOutlinedIcon = createAppIcon(InfoCircle);
export const IosShareIcon = createAppIcon(Export);
export const KeyIcon = createAppIcon(Key);
export const LightModeIcon = createAppIcon(Sun);
export const LogoutIcon = createAppIcon(Logout);
export const NotesIcon = createAppIcon(Note);
export const MessageIcon = createAppIcon(Message2);
export const MenuIcon = createAppIcon(HambergerMenu);
export const MoreVerticalIcon = createAppIcon(More2);
export const NotificationsIcon = createAppIcon(Notification);
export const NotificationsActiveIcon = createAppIcon(NotificationBing);
export const PaymentsIcon = createAppIcon(CardPos);
export const PieChartIcon = createAppIcon(Chart);
export const ReceiptLongIcon = createAppIcon(Receipt);
export const RemoveIcon = createAppIcon(Minus);
export const SavingsIcon = createAppIcon(Bank);
export const SearchIcon = createAppIcon(SearchNormal1);
export const SettingsBrightnessIcon = createAppIcon(Setting2);
export const ShoppingCartIcon = createAppIcon(ShoppingCart);
export const SwapHorizIcon = createAppIcon(ArrowSwapHorizontal);
export const SwitchAccountIcon = createAppIcon(Profile2User);
export const SyncAltIcon = createAppIcon(Convert);
export const TimerIcon = createAppIcon(Timer1);
export const TuneIcon = createAppIcon(Filter);
export const VisibilityIcon = createAppIcon(Eye);
export const VisibilityOffIcon = createAppIcon(EyeSlash);
export const WorkIcon = createAppIcon(Briefcase);
export const WalletIcon = createAppIcon(Wallet);

// Shared aliases used by GameHub screens. Keep icon-library use inside this adapter.
export const ArrowLeftIcon = createAppIcon(ArrowLeft);
export const CalendarClockIcon = createAppIcon(Calendar1);
export const CameraIcon = createAppIcon(Camera);
export const EmailIcon = createAppIcon(Sms);
export const ImportIcon = createAppIcon(Import);
export const CheckSimpleIcon = createAppIcon(TickCircle);
export const ChevronDownIcon = createAppIcon(ArrowDown2);
export const ExternalLinkIcon = createAppIcon(ExportSquare);
export const FacebookIcon = createAppIcon(Facebook);
export const GamepadIcon = createAppIcon(Game);
export const GlobeIcon = createAppIcon(Global);
export const InfinityIcon = forwardRef<SVGSVGElement, AppIconProps>(function InfinityIcon({ size = 24, ...props }, ref) {
  return (
    <SvgIcon ref={ref} viewBox="0 0 24 24" sx={{ fontSize: size }} {...props}>
      <path d="M18.2 7.5c-2.3 0-4.2 2.1-6.2 4.5-2-2.4-3.9-4.5-6.2-4.5a4.5 4.5 0 0 0 0 9c2.3 0 4.2-2.1 6.2-4.5 2 2.4 3.9 4.5 6.2 4.5a4.5 4.5 0 0 0 0-9Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </SvgIcon>
  );
});
export const PlayStationIcon = forwardRef<SVGSVGElement, AppIconProps>(function PlayStationIcon({ size = 24, ...props }, ref) {
  return <SvgIcon ref={ref} viewBox="0 0 285 215" sx={{ fontSize: size }} {...props}>
    <path fill="currentColor" d="M20.79,183C-1,176.77-4.7,163.91,5.26,156.5c9.21-6.87,24.87-12,24.87-12L94.8,121.4v26.32L48.26,164.45c-8.23,3-9.49,7.16-2.8,9.35s18.78,1.57,27-1.39l22.32-8.14v23.55c-1.41.26-3,.51-4.45.75A145.79,145.79,0,0,1,20.79,183Zm136.44,2.74,72.57-25.9c8.24-3,9.5-7.14,2.81-9.33s-18.78-1.57-27,1.4l-48.36,17.06V141.78l2.8-.95a165.71,165.71,0,0,1,33.61-7.13c19.65-2.17,43.71.3,62.59,7.46,21.29,6.74,23.69,16.67,18.28,23.51s-18.67,11.71-18.67,11.71l-98.61,35.49Zm8.49-168.57c38.21,13.19,51.16,29.61,51.16,66.61,0,36.05-22.14,49.72-50.26,36.07V52.62c0-7.88-1.44-15.14-8.8-17.2-5.64-1.82-9.14,3.45-9.14,11.33V215l-45.12-14.4V0c19.19,3.58,47.14,12,62.16,17.13Z" />
  </SvgIcon>;
});
export const XboxIcon = forwardRef<SVGSVGElement, AppIconProps>(function XboxIcon({ size = 24, ...props }, ref) {
  return <SvgIcon ref={ref} viewBox="0 0 24 24" sx={{ fontSize: size }} {...props}>
    <circle cx="12" cy="12" r="9.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M6.7 6.8c2.1-.2 3.8 1.3 5.3 2.8 1.5-1.5 3.2-3 5.3-2.8m-11 0c1.3 1.6 3.3 3.7 4.6 5.4-1.5 1.7-3.3 4.2-3.8 5.8m9.9-11.2c-1.3 1.6-3.3 3.7-4.6 5.4 1.5 1.7 3.3 4.2 3.8 5.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </SvgIcon>;
});
export const LinkIcon = createAppIcon(Link1);
export const MessageCircleIcon = createAppIcon(MessageCircle);
export const MonitorIcon = createAppIcon(Monitor);
export const SortIcon = createAppIcon(Sort);
export const MessengerIcon = createAppIcon(Messenger);
export const PencilIcon = createAppIcon(Edit2);
export const SendIcon = createAppIcon(Send2);
export const ShieldCheckIcon = createAppIcon(ShieldTick);
export const ShopIcon = createAppIcon(Shop);
export const SparkleIcon = createAppIcon(MagicStar);
export const StarIcon = createAppIcon(Star1);
export const InstagramIcon = createAppIcon(Instagram);
export const WhatsAppIcon = createAppIcon(Whatsapp);
export const WarningIcon = createAppIcon(Danger);
 
