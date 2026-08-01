import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({ 
  title = "Medellín Vibra | Agenda Cultural y Eventos en Medellín", 
  description = "Descubre la agenda de eventos culturales, conciertos, teatro y eventos académicos en Medellín. ¡Conéctate con la ciudad!", 
  image = "https://medellinvibra.co/og-image.jpg", 
  url = "https://medellinvibra.co" 
}) {
  return (
    <Helmet>
      {/* Título y Meta Descripción General */}
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Open Graph / WhatsApp / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}