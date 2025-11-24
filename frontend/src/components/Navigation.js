import React from 'react';
import { NavLink, Tooltip } from '@mantine/core';
import {
    IconBooks,
    IconUsers,
    IconExchange,
} from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';
import LogoSvg from '../assets/lms_logo-active.svg';
import LogoSvgInactive from '../assets/lms_logo-inactive.svg';

const mainLinks = [
    {
        icon: (isActive) => <img
            src={isActive ? LogoSvg : LogoSvgInactive}
            alt="Dashboard"
            style={{
                width: 61,
                height: 61,
                marginTop: '-10px'
            }}
        />,
        label: 'Dashboard',
        path: '/'
    },
    {
        icon: (isActive) => <IconWithBackground icon={IconBooks} isActive={isActive} />,
        label: 'Book Management',
        path: '/books'
    },
    {
        icon: (isActive) => <IconWithBackground icon={IconUsers} isActive={isActive} />,
        label: 'Member Management',
        path: '/members'
    },
    {
        icon: (isActive) => <IconWithBackground icon={IconExchange} isActive={isActive} />,
        label: 'Loan Management',
        path: '/loans'
    },
];

// component for icons with background
function IconWithBackground({ icon: Icon, isActive }) {
    return (
        <div style={{
            backgroundColor: '#141b1e',
            borderRadius: '8px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px'
        }}>
            <Icon
                size={24}
                color={isActive ? '#79a617' : '#48494b'}
            />
        </div>
    );
}

export function Navigation() {
    const navigate = useNavigate();
    const location = useLocation();

    const links = mainLinks.map((link) => {
        const isActive = location.pathname === link.path;

        return (
            <Tooltip
                key={link.label}
                label={link.label}
                position="right"
                withArrow
                transitionProps={{ transition: 'scale-x', duration: 300 }}
            >
                <NavLink
                    active={isActive}
                    leftSection={link.icon(isActive)}
                    onClick={() => navigate(link.path)}
                />
            </Tooltip>
        );
    });

    return (
        <div style={{
            padding: '10px 10px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            height: '100%'
        }}>
            {links}
        </div>
    );
}