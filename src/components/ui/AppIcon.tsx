/*
 * Scoreboard Manager
 * Copyright (c) 2026 Scoreboard Manager contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

'use client';

import { SVGProps } from 'react';

// Import only the icons that are actually used in the application
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowRightOnRectangleIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUpIcon,
  ArrowUpTrayIcon,
  Bars3Icon,
  BoltIcon,
  CalendarIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CodeBracketIcon,
  Cog6ToothIcon,
  DevicePhoneMobileIcon,
  EllipsisVerticalIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  FireIcon,
  GiftIcon,
  GlobeAltIcon,
  HashtagIcon,
  HeartIcon,
  HomeIcon,
  InboxIcon,
  InformationCircleIcon,
  LightBulbIcon,
  LinkIcon,
  ListBulletIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PaintBrushIcon,
  PaperAirplaneIcon,
  PauseIcon,
  PencilIcon,
  PhotoIcon,
  PlayIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  ServerStackIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  TrashIcon,
  TrophyIcon,
  TvIcon,
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
  ArrowsPointingInIcon as ArrowsPointingInIconSolid,
  ArrowsPointingOutIcon as ArrowsPointingOutIconSolid,
  ArrowTopRightOnSquareIcon as ArrowTopRightOnSquareIconSolid,
  ArrowUpIcon as ArrowUpIconSolid,
  ArrowUpTrayIcon as ArrowUpTrayIconSolid,
  Bars3Icon as Bars3IconSolid,
  BoltIcon as BoltIconSolid,
  CalendarIcon as CalendarIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  CheckBadgeIcon as CheckBadgeIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  CheckIcon as CheckIconSolid,
  ChevronDownIcon as ChevronDownIconSolid,
  ChevronLeftIcon as ChevronLeftIconSolid,
  ChevronRightIcon as ChevronRightIconSolid,
  ChevronUpIcon as ChevronUpIconSolid,
  ClipboardDocumentIcon as ClipboardDocumentIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  ClockIcon as ClockIconSolid,
  CodeBracketIcon as CodeBracketIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  DevicePhoneMobileIcon as DevicePhoneMobileIconSolid,
  EllipsisVerticalIcon as EllipsisVerticalIconSolid,
  EnvelopeIcon as EnvelopeIconSolid,
  FireIcon as FireIconSolid,
  ExclamationCircleIcon as ExclamationCircleIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  EyeIcon as EyeIconSolid,
  EyeSlashIcon as EyeSlashIconSolid,
  GiftIcon as GiftIconSolid,
  GlobeAltIcon as GlobeAltIconSolid,
  HashtagIcon as HashtagIconSolid,
  HeartIcon as HeartIconSolid,
  HomeIcon as HomeIconSolid,
  InboxIcon as InboxIconSolid,
  InformationCircleIcon as InformationCircleIconSolid,
  LightBulbIcon as LightBulbIconSolid,
  LinkIcon as LinkIconSolid,
  ListBulletIcon as ListBulletIconSolid,
  LockClosedIcon as LockClosedIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  PaintBrushIcon as PaintBrushIconSolid,
  PaperAirplaneIcon as PaperAirplaneIconSolid,
  PauseIcon as PauseIconSolid,
  PencilIcon as PencilIconSolid,
  PhotoIcon as PhotoIconSolid,
  PlayIcon as PlayIconSolid,
  PlusIcon as PlusIconSolid,
  QuestionMarkCircleIcon as QuestionMarkCircleIconSolid,
  ShieldCheckIcon as ShieldCheckIconSolid,
  SparklesIcon as SparklesIconSolid,
  StarIcon as StarIconSolid,
  TrashIcon as TrashIconSolid,
  TrophyIcon as TrophyIconSolid,
  TvIcon as TvIconSolid,
  UserCircleIcon as UserCircleIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  UserIcon as UserIconSolid,
  UserPlusIcon as UserPlusIconSolid,
  UsersIcon as UsersIconSolid,
  XCircleIcon as XCircleIconSolid,
  XMarkIcon as XMarkIconSolid,
  ServerStackIcon as ServerStackIconSolid,
} from '@heroicons/react/24/solid';

type SVGComponentProps = Omit<SVGProps<SVGSVGElement>, 'ref'>;
type IconComponent = React.ComponentType<SVGComponentProps>;

const GitHubIcon = (props: SVGComponentProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 15.07 3.633 14.7 3.633 14.7c-1.087-.744.083-.729.083-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.76-1.605-2.665-.305-5.466-1.334-5.466-5.931 0-1.31.465-2.381 1.235-3.221-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.911 1.23 3.221 0 4.609-2.805 5.624-5.475 5.921.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.816 24 17.317 24 12.019 24 5.67 18.627.297 12 .297z" />
  </svg>
);

// Map of icon names to their outline components
const outlineIcons: Record<string, IconComponent> = {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowRightOnRectangleIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUpIcon,
  ArrowUpTrayIcon,
  Bars3Icon,
  BoltIcon,
  CalendarIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CodeBracketIcon,
  Cog6ToothIcon,
  DevicePhoneMobileIcon,
  EllipsisVerticalIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  FireIcon,
  GiftIcon,
  GlobeAltIcon,
  HashtagIcon,
  HeartIcon,
  HomeIcon,
  InboxIcon,
  InformationCircleIcon,
  LightBulbIcon,
  LinkIcon,
  ListBulletIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PaintBrushIcon,
  PaperAirplaneIcon,
  PauseIcon,
  PencilIcon,
  PhotoIcon,
  PlayIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  ServerStackIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  TrashIcon,
  TrophyIcon,
  TvIcon,
  UserCircleIcon,
  UserGroupIcon,
  UserIcon,
  UserPlusIcon,
  UsersIcon,
  XCircleIcon,
  XMarkIcon,
  GitHubIcon,
};

// Map of icon names to their solid components
const solidIcons: Record<string, IconComponent> = {
  ArrowDownIcon: ArrowDownIconSolid,
  ArrowLeftIcon: ArrowLeftIconSolid,
  ArrowPathIcon: ArrowPathIconSolid,
  ArrowRightIcon: ArrowRightIconSolid,
  ArrowRightOnRectangleIcon: ArrowRightOnRectangleIconSolid,
  ArrowsPointingInIcon: ArrowsPointingInIconSolid,
  ArrowsPointingOutIcon: ArrowsPointingOutIconSolid,
  ArrowTopRightOnSquareIcon: ArrowTopRightOnSquareIconSolid,
  ArrowUpIcon: ArrowUpIconSolid,
  ArrowUpTrayIcon: ArrowUpTrayIconSolid,
  Bars3Icon: Bars3IconSolid,
  BoltIcon: BoltIconSolid,
  CalendarIcon: CalendarIconSolid,
  ChartBarIcon: ChartBarIconSolid,
  ChatBubbleLeftRightIcon: ChatBubbleLeftRightIconSolid,
  CheckBadgeIcon: CheckBadgeIconSolid,
  CheckCircleIcon: CheckCircleIconSolid,
  CheckIcon: CheckIconSolid,
  ChevronDownIcon: ChevronDownIconSolid,
  ChevronLeftIcon: ChevronLeftIconSolid,
  ChevronRightIcon: ChevronRightIconSolid,
  ChevronUpIcon: ChevronUpIconSolid,
  ClipboardDocumentIcon: ClipboardDocumentIconSolid,
  ClipboardDocumentListIcon: ClipboardDocumentListIconSolid,
  ClockIcon: ClockIconSolid,
  CodeBracketIcon: CodeBracketIconSolid,
  Cog6ToothIcon: Cog6ToothIconSolid,
  DevicePhoneMobileIcon: DevicePhoneMobileIconSolid,
  EllipsisVerticalIcon: EllipsisVerticalIconSolid,
  EnvelopeIcon: EnvelopeIconSolid,
  FireIcon: FireIconSolid,
  ExclamationCircleIcon: ExclamationCircleIconSolid,
  ExclamationTriangleIcon: ExclamationTriangleIconSolid,
  EyeIcon: EyeIconSolid,
  EyeSlashIcon: EyeSlashIconSolid,
  GiftIcon: GiftIconSolid,
  GlobeAltIcon: GlobeAltIconSolid,
  HashtagIcon: HashtagIconSolid,
  HeartIcon: HeartIconSolid,
  HomeIcon: HomeIconSolid,
  InboxIcon: InboxIconSolid,
  InformationCircleIcon: InformationCircleIconSolid,
  LightBulbIcon: LightBulbIconSolid,
  LinkIcon: LinkIconSolid,
  ListBulletIcon: ListBulletIconSolid,
  LockClosedIcon: LockClosedIconSolid,
  MagnifyingGlassIcon: MagnifyingGlassIconSolid,
  PaintBrushIcon: PaintBrushIconSolid,
  PaperAirplaneIcon: PaperAirplaneIconSolid,
  PauseIcon: PauseIconSolid,
  PencilIcon: PencilIconSolid,
  PhotoIcon: PhotoIconSolid,
  PlayIcon: PlayIconSolid,
  PlusIcon: PlusIconSolid,
  QuestionMarkCircleIcon: QuestionMarkCircleIconSolid,
  ShieldCheckIcon: ShieldCheckIconSolid,
  SparklesIcon: SparklesIconSolid,
  StarIcon: StarIconSolid,
  TrashIcon: TrashIconSolid,
  TrophyIcon: TrophyIconSolid,
  TvIcon: TvIconSolid,
  UserCircleIcon: UserCircleIconSolid,
  UserGroupIcon: UserGroupIconSolid,
  UserIcon: UserIconSolid,
  UserPlusIcon: UserPlusIconSolid,
  UsersIcon: UsersIconSolid,
  XCircleIcon: XCircleIconSolid,
  XMarkIcon: XMarkIconSolid,
  ServerStackIcon: ServerStackIconSolid,
  GitHubIcon,
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
