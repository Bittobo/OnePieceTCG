import AddIcon from '@mui/icons-material/Add';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import { AppBar, Box, Button, Container, Snackbar, Toolbar, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

interface NavigationState {
  notification?: string;
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const notification = (location.state as NavigationState | null)?.notification;
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    if (notification) {
      setMessage(notification);
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }
  }, [location.pathname, location.search, navigate, notification]);

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 1, flexWrap: 'wrap', py: 1 }}>
          <Typography
            component={RouterLink}
            to="/collections"
            variant="h6"
            sx={{
              color: 'inherit',
              textDecoration: 'none',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              mr: 'auto',
            }}
          >
            Grand Line Vault
          </Typography>
          <Button
            color="inherit"
            component={RouterLink}
            to="/collections"
            startIcon={<CollectionsBookmarkIcon />}
          >
            Collections
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/sealed"
            startIcon={<Inventory2Icon />}
          >
            Boxes &amp; Packs
          </Button>
          <Button
            variant="contained"
            color="secondary"
            component={RouterLink}
            to="/import"
            startIcon={<AddIcon />}
          >
            Import
          </Button>
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Outlet />
      </Container>

      <Snackbar
        open={Boolean(message)}
        autoHideDuration={3500}
        message={message}
        onClose={() => setMessage(undefined)}
      />
    </Box>
  );
}
