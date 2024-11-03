import React, { useEffect, useRef, useState } from 'react';
import { graphql, useStaticQuery } from 'gatsby';
import * as THREE from 'three';

const CubeViewer = () => {
  const containerRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isDeviceOrientationSupported, setIsDeviceOrientationSupported] = useState(false);

  const data = useStaticQuery(graphql`
    query {
      allFile(filter: { sourceInstanceName: { eq: "images" }, extension: { regex: "/(jpg|jpeg)/" } }) {
        nodes {
          publicURL
          name
        }
      }
    }
  `);

  // Request device orientation permission
  const requestPermission = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        setHasPermission(permission === 'granted');
        setIsDeviceOrientationSupported(true);
      } catch (error) {
        console.error('Error requesting device orientation permission:', error);
        setIsDeviceOrientationSupported(false);
      }
    } else if (typeof DeviceOrientationEvent !== 'undefined') {
      // Device supports orientation but doesn't need permission (e.g., Android)
      setHasPermission(true);
      setIsDeviceOrientationSupported(true);
    } else {
      setIsDeviceOrientationSupported(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let scene, camera, renderer, cube;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let currentRotationX = 0;
    let currentRotationY = 0;
    let isDragging = false;
    let previousTouchX = 0;
    let previousTouchY = 0;
    let initialAlpha = null;
    let initialBeta = null;

    const init = async () => {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      containerRef.current.appendChild(renderer.domElement);

      const geometry = new THREE.BoxGeometry(10, 10, 10);
      geometry.scale(-1, 1, 1);

      const imageUrls = data.allFile.nodes.slice(0, 6).map(node => node.publicURL);
      const texturePromises = imageUrls.map(url => loadTexture(url));
      const textures = await Promise.all(texturePromises);

      const materials = textures.map(texture =>
        new THREE.MeshBasicMaterial({ map: texture })
      );

      while (materials.length < 6) {
        materials.push(new THREE.MeshBasicMaterial({ color: 0x808080 }));
      }

      cube = new THREE.Mesh(geometry, materials);
      scene.add(cube);
      camera.position.set(0, 0, 0);

      animate();
    };

    const loadTexture = (url) => {
      return new Promise((resolve) => {
        const loader = new THREE.TextureLoader();
        loader.load(url, (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          resolve(texture);
        });
      });
    };

    const handleDeviceOrientation = (event) => {
      if (!hasPermission) return;

      // Initialize reference orientation
      if (initialAlpha === null || initialBeta === null) {
        initialAlpha = event.alpha;
        initialBeta = event.beta;
        return;
      }

      // Calculate relative rotation from initial position
      const deltaAlpha = THREE.MathUtils.degToRad(event.alpha - initialAlpha);
      const deltaBeta = THREE.MathUtils.degToRad(event.beta - initialBeta);

      // Apply smooth rotation
      targetRotationY = -deltaAlpha;
      targetRotationX = -deltaBeta * 0.5; // Reduced sensitivity for comfort

      // Clamp vertical rotation
      targetRotationX = Math.max(Math.min(targetRotationX, Math.PI / 2), -Math.PI / 2);
    };

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const onScroll = (event) => {
      if (hasPermission) return; // Disable scroll when using device orientation
      event.preventDefault();
      targetRotationY += event.deltaY * 0.002;
      targetRotationX += event.deltaX * 0.002;
      targetRotationX = Math.max(Math.min(targetRotationX, Math.PI / 2), -Math.PI / 2);
    };

    const onTouchStart = (event) => {
      if (hasPermission) return; // Disable touch when using device orientation
      event.preventDefault();
      isDragging = true;
      const touch = event.touches[0];
      previousTouchX = touch.clientX;
      previousTouchY = touch.clientY;
    };

    const onTouchMove = (event) => {
      if (!isDragging || hasPermission) return;
      event.preventDefault();

      const touch = event.touches[0];
      const deltaX = touch.clientX - previousTouchX;
      const deltaY = touch.clientY - previousTouchY;

      targetRotationY -= deltaX * 0.005;
      targetRotationX -= deltaY * 0.005;
      targetRotationX = Math.max(Math.min(targetRotationX, Math.PI / 2), -Math.PI / 2);

      previousTouchX = touch.clientX;
      previousTouchY = touch.clientY;
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    const animate = () => {
      const animationId = requestAnimationFrame(animate);

      currentRotationX += (targetRotationX - currentRotationX) * 0.05;
      currentRotationY += (targetRotationY - currentRotationY) * 0.05;

      camera.rotation.order = 'YXZ';
      camera.rotation.y = currentRotationY;
      camera.rotation.x = currentRotationX;

      renderer.render(scene, camera);

      return animationId;
    };

    init();
    requestPermission();

    // Event listeners
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('wheel', onScroll, { passive: false });
    window.addEventListener('deviceorientation', handleDeviceOrientation, false);
    containerRef.current.addEventListener('touchstart', onTouchStart, { passive: false });
    containerRef.current.addEventListener('touchmove', onTouchMove, { passive: false });
    containerRef.current.addEventListener('touchend', onTouchEnd, false);

    return () => {
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('wheel', onScroll);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      containerRef.current?.removeEventListener('touchstart', onTouchStart);
      containerRef.current?.removeEventListener('touchmove', onTouchMove);
      containerRef.current?.removeEventListener('touchend', onTouchEnd);
      if (cube) {
        cube.geometry.dispose();
        cube.material.forEach(material => {
          if (material.map) material.map.dispose();
          material.dispose();
        });
      }
      scene?.dispose();
      renderer?.dispose();
    };
  }, [data, hasPermission]);

  return (
    <div>
      {isDeviceOrientationSupported && !hasPermission && (
        <button
          onClick={requestPermission}
          style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Enable Device Orientation
        </button>
      )}
      <div
        ref={containerRef}
        style={{
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
        }}
      />
    </div>
  );
};

export default CubeViewer;