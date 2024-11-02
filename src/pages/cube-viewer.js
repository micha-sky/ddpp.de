// src/pages/cube-viewer.js
import React, { useEffect, useRef } from 'react';
import { graphql, useStaticQuery } from 'gatsby';
import * as THREE from 'three';

const CubeViewer = () => {
  const containerRef = useRef(null);

  // Query all images from the images folder
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

    const init = async () => {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      containerRef.current.appendChild(renderer.domElement);

      const geometry = new THREE.BoxGeometry(10, 10, 10);
      geometry.scale(-1, 1, 1);

      // Get the first 6 images from the query result
      const imageUrls = data.allFile.nodes.slice(0, 6).map(node => node.publicURL);

      // Load all textures concurrently
      const texturePromises = imageUrls.map(url => loadTexture(url));
      const textures = await Promise.all(texturePromises);

      const materials = textures.map(texture =>
        new THREE.MeshBasicMaterial({ map: texture })
      );

      // If we don't have enough images, fill with placeholder materials
      while (materials.length < 6) {
        materials.push(new THREE.MeshBasicMaterial({ color: 0x808080 }));
      }

      cube = new THREE.Mesh(geometry, materials);
      scene.add(cube);
      camera.position.set(0, 0, 0);

      // Start animation once everything is loaded
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

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const onScroll = (event) => {
      event.preventDefault();
      targetRotationY += event.deltaY * 0.002;
      targetRotationX += event.deltaX * 0.002;
      targetRotationX = Math.max(Math.min(targetRotationX, Math.PI / 2), -Math.PI / 2);
    };

    const onTouchStart = (event) => {
      event.preventDefault();
      isDragging = true;
      const touch = event.touches[0];
      previousTouchX = touch.clientX;
      previousTouchY = touch.clientY;
    };

    const onTouchMove = (event) => {
      if (!isDragging) return;
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

    // Event listeners
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('wheel', onScroll, { passive: false });
    containerRef.current.addEventListener('touchstart', onTouchStart, { passive: false });
    containerRef.current.addEventListener('touchmove', onTouchMove, { passive: false });
    containerRef.current.addEventListener('touchend', onTouchEnd, false);

    // Cleanup
    return () => {
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('wheel', onScroll);
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
  }, [data]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    />
  );
};

export default CubeViewer;