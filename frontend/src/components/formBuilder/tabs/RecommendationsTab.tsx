import React from 'react';
import { Box, Typography, Alert, Paper } from '@mui/material';
import { TipsAndUpdates as TipsIcon } from '@mui/icons-material';
import { Form, FormField } from '../../../stores/formBuilderStore';

interface RecommendationsTabProps {
  form: Form | null;
  fields: FormField[];
}

const RecommendationsTab: React.FC<RecommendationsTabProps> = ({ form, fields }) => {
  const recommendations = [
    {
      id: 'simplify',
      title: 'Simplificación de formularios',
      description: 'Considera dividir formularios largos en múltiples pasos para mejorar la conversión.',
      applicable: fields.length > 10,
    },
    {
      id: 'multi-step',
      title: 'Agregar varios pasos',
      description: 'Divide tu formulario en pasos más pequeños y manejables.',
      applicable: fields.length > 8,
    },
    {
      id: 'required-fields',
      title: 'Campos requeridos',
      description: 'Minimiza los campos requeridos para aumentar la tasa de completado.',
      applicable: fields.filter((f) => f.isRequired).length > fields.length / 2,
    },
  ];

  const applicableRecommendations = recommendations.filter((r) => r.applicable);

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Recomendaciones
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Optimiza tu formulario para una mejor tasa de conversión y experiencia de usuario.
      </Typography>

      {applicableRecommendations.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {applicableRecommendations.map((rec) => (
            <Paper key={rec.id} sx={{ p: 2, borderLeft: 4, borderColor: 'warning.main' }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TipsIcon color="warning" />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {rec.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {rec.description}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      ) : (
        <Alert severity="success">
          <Typography variant="body2">
            ✓ Tu formulario está bien optimizado. No hay recomendaciones en este momento.
          </Typography>
        </Alert>
      )}

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Próximamente:</strong> Recomendaciones avanzadas basadas en IA y analytics.
        </Typography>
      </Alert>
    </Box>
  );
};

export default RecommendationsTab;


