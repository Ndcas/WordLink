import defaultAvatar from '../assets/default.jpg';
import avatar1 from '../assets/avatar-cute-1.webp';
import avatar2 from '../assets/avatar-cute-2.webp';
import avatar3 from '../assets/avatar-cute-3.webp';
import avatar4 from '../assets/avatar-cute-4.webp';
import avatar5 from '../assets/avatar-cute-5.webp';
import avatar7 from '../assets/avatar-cute-7.webp';
import avatar8 from '../assets/avatar-cute-8.webp';
import avatar9 from '../assets/avatar-cute-9.webp';
import avatar10 from '../assets/avatar-cute-10.webp';
import avatar18 from '../assets/avatar-cute-18.webp';
import avatar22 from '../assets/avatar-cute-22.webp';
import avatar23 from '../assets/avatar-cute-23.webp';
import avatar24 from '../assets/avatar-cute-24.webp';
import avatar25 from '../assets/avatar-cute-25.webp';
import avatar31 from '../assets/avatar-cute-31.webp';

const avatarMap = {
    'avatar-cute-1.webp': avatar1,
    'avatar-cute-2.webp': avatar2,
    'avatar-cute-3.webp': avatar3,
    'avatar-cute-4.webp': avatar4,
    'avatar-cute-5.webp': avatar5,
    'avatar-cute-7.webp': avatar7,
    'avatar-cute-8.webp': avatar8,
    'avatar-cute-9.webp': avatar9,
    'avatar-cute-10.webp': avatar10,
    'avatar-cute-18.webp': avatar18,
    'avatar-cute-22.webp': avatar22,
    'avatar-cute-23.webp': avatar23,
    'avatar-cute-24.webp': avatar24,
    'avatar-cute-25.webp': avatar25,
    'avatar-cute-31.webp': avatar31,
};

export function getAvatarImage(filename) {
    return avatarMap[filename] || defaultAvatar;
}

export function getAvatarList() {
    return Object.keys(avatarMap);
}
