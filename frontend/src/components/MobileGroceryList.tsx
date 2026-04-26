import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  IconButton,
  Typography,
  Chip,
  Paper,
  Collapse,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface GroceryItem {
  id: string;
  name: string;
  quantity?: string;
  category?: string;
  checked: boolean;
}

interface MobileGroceryListProps {
  items: GroceryItem[];
  onToggleItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  groupByCategory?: boolean;
}

const MobileGroceryList: React.FC<MobileGroceryListProps> = ({
  items,
  onToggleItem,
  onDeleteItem,
  groupByCategory = true,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Uncategorized'])
  );

  // Group items by category
  const groupedItems = React.useMemo(() => {
    if (!groupByCategory) {
      return { 'All Items': items };
    }

    const groups: Record<string, GroceryItem[]> = {};
    items.forEach((item) => {
      const category = item.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });

    // Sort categories: Uncategorized first, then alphabetically
    const sortedGroups: Record<string, GroceryItem[]> = {};
    const categories = Object.keys(groups).sort((a, b) => {
      if (a === 'Uncategorized') return -1;
      if (b === 'Uncategorized') return 1;
      return a.localeCompare(b);
    });

    categories.forEach((cat) => {
      sortedGroups[cat] = groups[cat];
    });

    return sortedGroups;
  }, [items, groupByCategory]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  return (
    <Box sx={{ pb: 2 }}>
      {Object.entries(groupedItems).map(([category, categoryItems]) => {
        const isExpanded = expandedCategories.has(category);
        const checkedCount = categoryItems.filter((item) => item.checked).length;
        const totalCount = categoryItems.length;

        return (
          <Paper
            key={category}
            elevation={1}
            sx={{
              mb: 2,
              overflow: 'hidden',
              borderRadius: 2,
            }}
          >
            {/* Category Header */}
            {groupByCategory && (
              <Box
                component="button"
                type="button"
                onClick={() => toggleCategory(category)}
                sx={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  cursor: 'pointer',
                  minHeight: 56, // Touch target
                  border: 0,
                  textAlign: 'left',
                  '&:active': {
                    bgcolor: 'primary.dark',
                  },
                }}
                aria-expanded={isExpanded}
                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${category} category`}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {category}
                  </Typography>
                  <Chip
                    label={`${checkedCount}/${totalCount}`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: 'inherit',
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <IconButton
                  size="small"
                  sx={{ color: 'inherit', minWidth: 44, minHeight: 44 }}
                  aria-label={isExpanded ? 'Collapse category' : 'Expand category'}
                >
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
            )}

            {/* Items List */}
            <Collapse in={isExpanded} timeout="auto">
              <List sx={{ p: 0 }}>
                {categoryItems.map((item) => (
                  <ListItem
                    key={item.id}
                    sx={{
                      minHeight: 56, // Touch target
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': {
                        borderBottom: 'none',
                      },
                    }}
                    secondaryAction={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                          edge="end"
                          aria-label={`Delete ${item.name}`}
                          onClick={() => onDeleteItem(item.id)}
                          sx={{
                            minWidth: 44,
                            minHeight: 44,
                            color: 'error.main',
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                        <Checkbox
                          edge="end"
                          checked={item.checked}
                          onChange={() => onToggleItem(item.id)}
                          sx={{
                            minWidth: 44,
                            minHeight: 44,
                          }}
                          inputProps={{
                            'aria-label': `Mark ${item.name} as ${
                              item.checked ? 'unchecked' : 'checked'
                            }`,
                          }}
                        />
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={
                        <Typography
                          sx={{
                            textDecoration: item.checked ? 'line-through' : 'none',
                            color: 'text.primary',
                            fontWeight: item.checked ? 400 : 500,
                          }}
                        >
                          {item.name}
                        </Typography>
                      }
                      secondary={item.quantity}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </Paper>
        );
      })}
    </Box>
  );
};

export default MobileGroceryList;

// Made with Bob
