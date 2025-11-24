import React from 'react';
import { MantineProvider, AppShell, Text, Group } from '@mantine/core';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { BookManagement } from './pages/BookManagement';
import { MemberManagement } from './pages/MemberManagement';
import { LoanManagement } from './pages/LoanManagement';

// component to display page title
function PageTitleHeader() {
    const location = useLocation();

    const pageTitles = {
        '/': 'Dashboard',
        '/books': 'Book Management',
        '/members': 'Member Management',
        '/loans': 'Loan Management'
    };

    const currentTitle = pageTitles[location.pathname] || '';

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '20px',
            backgroundColor: '#79a617',
            color: '#0F1317FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: '20px',
            zIndex: 200,
            fontSize: '14px',
            fontWeight: 500
        }}>
            {currentTitle}
        </div>
    );
}

function App() {
    return (
        <MantineProvider withGlobalStyles withNormalizeCSS>
            <Router>
                {/* Page Title Header */}
                <PageTitleHeader />

                <AppShell
                    padding="md"
                    navbar={{ width: 250, breakpoint: 'sm' }}
                    header={{ height: 60 }}
                >
                    <AppShell.Header p="xs">
                        <Group justify="space-between" h="100%">
                            <Text size="xl" fw={700}>
                                Library Management System
                            </Text>
                        </Group>
                    </AppShell.Header>

                    <AppShell.Navbar p="md">
                        <Navigation />
                    </AppShell.Navbar>

                    <AppShell.Main>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/books" element={<BookManagement />} />
                            <Route path="/members" element={<MemberManagement />} />
                            <Route path="/loans" element={<LoanManagement />} />
                        </Routes>
                    </AppShell.Main>
                </AppShell>
            </Router>
        </MantineProvider>
    );
}

export default App;