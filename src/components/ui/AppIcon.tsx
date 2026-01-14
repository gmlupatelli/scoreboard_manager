'use client';

import { SVGProps } from 'react';

// Import only the icons that are actually used in the application
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowRightOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUpIcon,
  ArrowUpTrayIcon,
  CalendarIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CodeBracketIcon,
  EllipsisVerticalIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  GlobeAltIcon,
  HashtagIcon,
  HeartIcon,
  HomeIcon,
  InboxIcon,
  InformationCircleIcon,
  LightBulbIcon,
  ListBulletIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PaintBrushIcon,
  PaperAirplaneIcon,
  PencilIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  TrashIcon,
  TrophyIcon,
  UserCircleIcon,
  UserGroupIcon,
  UserIcon,
  UserPlusIcon,
  UsersIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import {
  ArrowDownIcon as ArrowDownIconSolid,
  ArrowLeftIcon as ArrowLeftIconSolid,
  ArrowPathIcon as ArrowPathIconSolid,
  ArrowRightIcon as ArrowRightIconSolid,
  ArrowRightOnRectangleIcon as ArrowRightOnRectangleIconSolid,
  ArrowTopRightOnSquareIcon as ArrowTopRightOnSquareIconSolid,
  ArrowUpIcon as ArrowUpIconSolid,
  ArrowUpTrayIcon as ArrowUpTrayIconSolid,
  CalendarIcon as CalendarIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  CheckBadgeIcon as CheckBadgeIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  CheckIcon as CheckIconSolid,
  ChevronDownIcon as ChevronDownIconSolid,
  ChevronLeftIcon as ChevronLeftIconSolid,
  ChevronRightIcon as ChevronRightIconSolid,
  ClipboardDocumentIcon as ClipboardDocumentIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  ClockIcon as ClockIconSolid,
  CodeBracketIcon as CodeBracketIconSolid,
  EllipsisVerticalIcon as EllipsisVerticalIconSolid,
  EnvelopeIcon as EnvelopeIconSolid,
  ExclamationCircleIcon as ExclamationCircleIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  EyeIcon as EyeIconSolid,
  GlobeAltIcon as GlobeAltIconSolid,
  HashtagIcon as HashtagIconSolid,
  HeartIcon as HeartIconSolid,
  HomeIcon as HomeIconSolid,
  InboxIcon as InboxIconSolid,
  InformationCircleIcon as InformationCircleIconSolid,
  LightBulbIcon as LightBulbIconSolid,
  ListBulletIcon as ListBulletIconSolid,
  LockClosedIcon as LockClosedIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  PaintBrushIcon as PaintBrushIconSolid,
  PaperAirplaneIcon as PaperAirplaneIconSolid,
  PencilIcon as PencilIconSolid,
  PlusIcon as PlusIconSolid,
  QuestionMarkCircleIcon as QuestionMarkCircleIconSolid,
  ShieldCheckIcon as ShieldCheckIconSolid,
  SparklesIcon as SparklesIconSolid,
  StarIcon as StarIconSolid,
  TrashIcon as TrashIconSolid,
  TrophyIcon as TrophyIconSolid,
  UserCircleIcon as UserCircleIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  UserIcon as UserIconSolid,
  UserPlusIcon as UserPlusIconSolid,
  UsersIcon as UsersIconSolid,
  XCircleIcon as XCircleIconSolid,
  XMarkIcon as XMarkIconSolid,
} from '@heroicons/react/24/solid';

type SVGComponentProps = Omit<SVGProps<SVGSVGElement>, 'ref'>;
type IconComponent = React.ComponentType<SVGComponentProps>;

// Map of icon names to their outline components
const outlineIcons: Record<string, IconComponent> = {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowRightOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUpIcon,
  ArrowUpTrayIcon,
  CalendarIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CodeBracketIcon,
  EllipsisVerticalIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  GlobeAltIcon,
  HashtagIcon,
  HeartIcon,
  HomeIcon,
  InboxIcon,
  InformationCircleIcon,
  LightBulbIcon,
  ListBulletIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PaintBrushIcon,
  PaperAirplaneIcon,
  PencilIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  TrashIcon,
  TrophyIcon,
  UserCircleIcon,
  UserGroupIcon,
  UserIcon,
  UserPlusIcon,
  UsersIcon,
  XCircleIcon,
  XMarkIcon,
};

// Map of icon names to their solid components
const solidIcons: Record<string, IconComponent> = {
  ArrowDownIcon: ArrowDownIconSolid,
  ArrowLeftIcon: ArrowLeftIconSolid,
  ArrowPathIcon: ArrowPathIconSolid,
  ArrowRightIcon: ArrowRightIconSolid,
  ArrowRightOnRectangleIcon: ArrowRightOnRectangleIconSolid,
  ArrowTopRightOnSquareIcon: ArrowTopRightOnSquareIconSolid,
  ArrowUpIcon: ArrowUpIconSolid,
  ArrowUpTrayIcon: ArrowUpTrayIconSolid,
  CalendarIcon: CalendarIconSolid,
  ChartBarIcon: ChartBarIconSolid,
  ChatBubbleLeftRightIcon: ChatBubbleLeftRightIconSolid,
  CheckBadgeIcon: CheckBadgeIconSolid,
  CheckCircleIcon: CheckCircleIconSolid,
  CheckIcon: CheckIconSolid,
  ChevronDownIcon: ChevronDownIconSolid,
  ChevronLeftIcon: ChevronLeftIconSolid,
  ChevronRightIcon: ChevronRightIconSolid,
  ClipboardDocumentIcon: ClipboardDocumentIconSolid,
  ClipboardDocumentListIcon: ClipboardDocumentListIconSolid,
  ClockIcon: ClockIconSolid,
  CodeBracketIcon: CodeBracketIconSolid,
  EllipsisVerticalIcon: EllipsisVerticalIconSolid,
  EnvelopeIcon: EnvelopeIconSolid,
  ExclamationCircleIcon: ExclamationCircleIconSolid,
  ExclamationTriangleIcon: ExclamationTriangleIconSolid,
  EyeIcon: EyeIconSolid,
  GlobeAltIcon: GlobeAltIconSolid,
  HashtagIcon: HashtagIconSolid,
  HeartIcon: HeartIconSolid,
  HomeIcon: HomeIconSolid,
  InboxIcon: InboxIconSolid,
  InformationCircleIcon: InformationCircleIconSolid,
  LightBulbIcon: LightBulbIconSolid,
  ListBulletIcon: ListBulletIconSolid,
  LockClosedIcon: LockClosedIconSolid,
  MagnifyingGlassIcon: MagnifyingGlassIconSolid,
  PaintBrushIcon: PaintBrushIconSolid,
  PaperAirplaneIcon: PaperAirplaneIconSolid,
  PencilIcon: PencilIconSolid,
  PlusIcon: PlusIconSolid,
  QuestionMarkCircleIcon: QuestionMarkCircleIconSolid,
  ShieldCheckIcon: ShieldCheckIconSolid,
  SparklesIcon: SparklesIconSolid,
  StarIcon: StarIconSolid,
  TrashIcon: TrashIconSolid,
  TrophyIcon: TrophyIconSolid,
  UserCircleIcon: UserCircleIconSolid,
  UserGroupIcon: UserGroupIconSolid,
  UserIcon: UserIconSolid,
  UserPlusIcon: UserPlusIconSolid,
  UsersIcon: UsersIconSolid,
  XCircleIcon: XCircleIconSolid,
  XMarkIcon: XMarkIconSolid,
};

type IconVariant = 'outline' | 'solid';

interface IconProps extends Omit<SVGComponentProps, 'onClick'> {
  name: string;
  variant?: IconVariant;
  size?: number;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

function Icon({
  name,
  variant = 'outline',
  size = 24,
  className = '',
  onClick,
  disabled = false,
  ...props
}: IconProps) {
  const iconSet = variant === 'solid' ? solidIcons : outlineIcons;
  const IconComponent = iconSet[name];

  if (!IconComponent) {
    // Fallback to QuestionMarkCircleIcon for unknown icons
    return (
      <QuestionMarkCircleIcon
        width={size}
        height={size}
        className={`text-gray-400 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        onClick={disabled ? undefined : onClick}
        style={props.style}
        aria-hidden={props['aria-hidden']}
        aria-label={props['aria-label']}
      />
    );
  }

  return (
    <IconComponent
      width={size}
      height={size}
      className={`${disabled ? 'opacity-50 cursor-not-allowed' : onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
      onClick={disabled ? undefined : onClick}
      {...props}
    />
  );
}

export default Icon;
