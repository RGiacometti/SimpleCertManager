import React from 'react';
import { Typography, Tooltip } from '@mui/material';
import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

const DateDisplay = ({ 
  date, 
  variant = 'body2', 
  showRelative = false,
  format: dateFormat = 'PPpp',
  color = 'text.secondary',
  ...props 
}) => {
  if (!date) {
    return <Typography variant={variant} color={color} {...props}>-</Typography>;
  }

  // Parse date if it's a string
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(parsedDate)) {
    return <Typography variant={variant} color={color} {...props}>Invalid date</Typography>;
  }

  const formattedDate = format(parsedDate, dateFormat);
  const relativeDate = formatDistanceToNow(parsedDate, { addSuffix: true });

  if (showRelative) {
    return (
      <Tooltip title={formattedDate} arrow>
        <Typography variant={variant} color={color} {...props}>
          {relativeDate}
        </Typography>
      </Tooltip>
    );
  }

  return (
    <Typography variant={variant} color={color} {...props}>
      {formattedDate}
    </Typography>
  );
};

export default DateDisplay;
