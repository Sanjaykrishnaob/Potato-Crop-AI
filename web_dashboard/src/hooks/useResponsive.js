import { useState, useEffect } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';

export const useResponsive = () => {
  const theme = useTheme();
  const [deviceType, setDeviceType] = useState('desktop');
  const [orientation, setOrientation] = useState('portrait');
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Media queries for different breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600px - 960px
  const isDesktop = useMediaQuery(theme.breakpoints.up('md')); // > 960px
  const isLargeDesktop = useMediaQuery(theme.breakpoints.up('lg')); // > 1280px
  
  // Specific device checks
  const isMobileDevice = useMediaQuery('(max-width: 768px)');
  const isTabletDevice = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  const isSmallMobile = useMediaQuery('(max-width: 480px)');
  const isTouchDevice = useMediaQuery('(pointer: coarse)');

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });

      // Determine device type based on screen size and capabilities
      if (window.innerWidth <= 480) {
        setDeviceType('small-mobile');
      } else if (window.innerWidth <= 768) {
        setDeviceType('mobile');
      } else if (window.innerWidth <= 1024) {
        setDeviceType('tablet');
      } else if (window.innerWidth <= 1440) {
        setDeviceType('desktop');
      } else {
        setDeviceType('large-desktop');
      }

      // Determine orientation
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    };

    const handleResize = () => {
      updateDimensions();
    };

    const handleOrientationChange = () => {
      setTimeout(updateDimensions, 100); // Delay to ensure dimensions are updated
    };

    // Initial setup
    updateDimensions();

    // Event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Layout configurations for different devices
  const getLayoutConfig = () => {
    switch (deviceType) {
      case 'small-mobile':
        return {
          sidebarWidth: 0,
          bottomNavigation: true,
          compactHeader: true,
          cardSpacing: 1,
          containerPadding: 1,
          columnsCount: 1,
          showSidebar: false,
          headerHeight: 48,
          contentPadding: 8,
        };
      case 'mobile':
        return {
          sidebarWidth: 0,
          bottomNavigation: true,
          compactHeader: true,
          cardSpacing: 2,
          containerPadding: 2,
          columnsCount: orientation === 'landscape' ? 2 : 1,
          showSidebar: false,
          headerHeight: 56,
          contentPadding: 12,
        };
      case 'tablet':
        return {
          sidebarWidth: 240,
          bottomNavigation: false,
          compactHeader: false,
          cardSpacing: 3,
          containerPadding: 3,
          columnsCount: orientation === 'landscape' ? 3 : 2,
          showSidebar: true,
          headerHeight: 64,
          contentPadding: 16,
        };
      case 'desktop':
        return {
          sidebarWidth: 280,
          bottomNavigation: false,
          compactHeader: false,
          cardSpacing: 3,
          containerPadding: 3,
          columnsCount: 3,
          showSidebar: true,
          headerHeight: 64,
          contentPadding: 24,
        };
      case 'large-desktop':
        return {
          sidebarWidth: 320,
          bottomNavigation: false,
          compactHeader: false,
          cardSpacing: 4,
          containerPadding: 4,
          columnsCount: 4,
          showSidebar: true,
          headerHeight: 72,
          contentPadding: 32,
        };
      default:
        return {
          sidebarWidth: 280,
          bottomNavigation: false,
          compactHeader: false,
          cardSpacing: 3,
          containerPadding: 3,
          columnsCount: 3,
          showSidebar: true,
          headerHeight: 64,
          contentPadding: 24,
        };
    }
  };

  // Component size configurations
  const getComponentSizes = () => {
    return {
      // Button sizes
      buttonSize: isMobile ? 'small' : isTablet ? 'medium' : 'medium',
      iconButtonSize: isMobile ? 'small' : 'medium',
      
      // Text field sizes
      textFieldSize: isMobile ? 'small' : 'medium',
      
      // Chart dimensions
      chartHeight: isMobile ? 200 : isTablet ? 300 : 400,
      
      // Card dimensions
      cardMinHeight: isMobile ? 120 : isTablet ? 160 : 200,
      
      // Font sizes
      titleVariant: isMobile ? 'h6' : isTablet ? 'h5' : 'h4',
      subtitleVariant: isMobile ? 'body2' : 'subtitle1',
      
      // Spacing
      sectionSpacing: isMobile ? 2 : isTablet ? 3 : 4,
      itemSpacing: isMobile ? 1 : 2,
      
      // Image sizes
      avatarSize: isMobile ? 32 : isTablet ? 40 : 48,
      
      // Drawer configurations
      drawerVariant: isMobile ? 'temporary' : 'permanent',
      drawerAnchor: isMobile ? 'bottom' : 'left',
    };
  };

  return {
    deviceType,
    orientation,
    dimensions,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isMobileDevice,
    isTabletDevice,
    isSmallMobile,
    isTouchDevice,
    layoutConfig: getLayoutConfig(),
    componentSizes: getComponentSizes(),
  };
};

export default useResponsive;
