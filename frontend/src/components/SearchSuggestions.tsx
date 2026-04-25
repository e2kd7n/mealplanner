/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import React from 'react';
import {
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Box,
  Chip,
} from '@mui/material';
import {
  History as HistoryIcon,
  TrendingUp as TrendingIcon,
  Restaurant as IngredientIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import type { SearchSuggestion } from '../hooks/useSearchSuggestions';

interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[];
  onSelect: (suggestion: string) => void;
  onClose: () => void;
  highlightedIndex: number;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  suggestions,
  onSelect,
  highlightedIndex,
}) => {
  if (suggestions.length === 0) {
    return null;
  }

  const getIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return <HistoryIcon fontSize="small" />;
      case 'popular':
        return <TrendingIcon fontSize="small" />;
      case 'ingredient':
        return <IngredientIcon fontSize="small" />;
      default:
        return <SearchIcon fontSize="small" />;
    }
  };


  // Group suggestions by type
  const recentSuggestions = suggestions.filter(s => s.type === 'recent');
  const popularSuggestions = suggestions.filter(s => s.type === 'popular');
  const ingredientSuggestions = suggestions.filter(s => s.type === 'ingredient');

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        mt: 1,
        maxHeight: 400,
        overflow: 'auto',
        zIndex: 1300,
      }}
    >
      <List dense>
        {/* Recent Searches */}
        {recentSuggestions.length > 0 && (
          <>
            <ListItem>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                RECENT SEARCHES
              </Typography>
            </ListItem>
            {recentSuggestions.map((suggestion, index) => {
              const globalIndex = suggestions.indexOf(suggestion);
              return (
                <ListItemButton
                  key={`recent-${index}`}
                  selected={globalIndex === highlightedIndex}
                  onClick={() => onSelect(suggestion.text)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'action.selected',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {getIcon(suggestion.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={suggestion.text}
                    primaryTypographyProps={{
                      variant: 'body2',
                    }}
                  />
                </ListItemButton>
              );
            })}
            {(popularSuggestions.length > 0 || ingredientSuggestions.length > 0) && (
              <Divider sx={{ my: 1 }} />
            )}
          </>
        )}

        {/* Popular Searches */}
        {popularSuggestions.length > 0 && (
          <>
            <ListItem>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                POPULAR SEARCHES
              </Typography>
            </ListItem>
            {popularSuggestions.map((suggestion, index) => {
              const globalIndex = suggestions.indexOf(suggestion);
              return (
                <ListItemButton
                  key={`popular-${index}`}
                  selected={globalIndex === highlightedIndex}
                  onClick={() => onSelect(suggestion.text)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'action.selected',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {getIcon(suggestion.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">{suggestion.text}</Typography>
                        {suggestion.count && (
                          <Chip
                            label={suggestion.count}
                            size="small"
                            sx={{ height: 18, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
              );
            })}
            {ingredientSuggestions.length > 0 && <Divider sx={{ my: 1 }} />}
          </>
        )}

        {/* Ingredient Suggestions */}
        {ingredientSuggestions.length > 0 && (
          <>
            <ListItem>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                INGREDIENTS
              </Typography>
            </ListItem>
            {ingredientSuggestions.map((suggestion, index) => {
              const globalIndex = suggestions.indexOf(suggestion);
              return (
                <ListItemButton
                  key={`ingredient-${index}`}
                  selected={globalIndex === highlightedIndex}
                  onClick={() => onSelect(suggestion.text)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'action.selected',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {suggestion.icon ? (
                      <Typography fontSize="1.2rem">{suggestion.icon}</Typography>
                    ) : (
                      getIcon(suggestion.type)
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={suggestion.text}
                    primaryTypographyProps={{
                      variant: 'body2',
                    }}
                  />
                </ListItemButton>
              );
            })}
          </>
        )}
      </List>
    </Paper>
  );
};

export default SearchSuggestions;

// Made with Bob
