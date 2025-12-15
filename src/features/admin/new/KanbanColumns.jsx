import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Switch,
  FormControlLabel,
  Chip,
  Collapse,
  Card,
  CardContent,
  Divider,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  OutlinedInput,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  DragIndicator as DragIndicatorIcon,
  ColorLens as ColorLensIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { columnTemplateApi } from './services/adminApi';
import toast from 'react-hot-toast';
import { DESIGNATIONS } from '../utils/designations';

// Sortable Column Item Component
function SortableColumnItem({ column, index, onEdit, onDelete, onToggleSubColumns, onAddSubColumn, onEditSubColumn, onDeleteSubColumn, onToggleExpand }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingColor, setEditingColor] = useState(false);
  const [tempName, setTempName] = useState(column.name);
  const [tempColor, setTempColor] = useState(column.color || theme.palette.primary.main);

  const handleSaveName = () => {
    if (tempName.trim()) {
      onEdit({ ...column, name: tempName.trim() });
      setEditingName(false);
    }
  };

  const handleSaveColor = () => {
    if (/^#[0-9A-Fa-f]{6}$/i.test(tempColor)) {
      onEdit({ ...column, color: tempColor });
      setEditingColor(false);
    } else {
      toast.error('Invalid color format. Use hex format like #FF5733');
    }
  };

  const columnId = column._id || column.id || `col-${index}`;

  return (
    <Draggable draggableId={String(columnId)} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          elevation={0}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.5 : 1,
            marginBottom: 16
          }}
          sx={{ 
            mb: 2, 
            border: `1px solid ${theme.palette.divider}`,
            color: theme.palette.text.primary,
            '&:hover': {
              borderColor: theme.palette.primary.main,
              boxShadow: theme.palette.mode === 'dark' 
                ? `0 2px 8px rgba(0,0,0,0.3)`
                : `0 2px 8px rgba(0,0,0,0.1)`
            },
            '& .MuiCardContent-root': {
              bgcolor: 'transparent',
              backgroundColor: 'transparent'
            }
          }}
        >
          <CardContent sx={{ bgcolor: 'transparent', backgroundColor: 'transparent' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box 
                {...provided.dragHandleProps} 
                sx={{ 
                  cursor: 'grab', 
                  display: 'flex', 
                  alignItems: 'center',
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    color: theme.palette.text.primary
                  }
                }}
              >
                <DragIndicatorIcon />
              </Box>
          
          <Box sx={{ flex: 1 }}>
            {editingName ? (
              <TextField
                size="small"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleSaveName}
                onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
                autoFocus
                fullWidth
                sx={{
                  '& .MuiInputBase-input': {
                    color: theme.palette.text.primary
                  }
                }}
              />
            ) : (
              <Typography 
                variant="h6" 
                onClick={() => setEditingName(true)} 
                sx={{ 
                  cursor: 'pointer',
                  color: theme.palette.text.primary
                }}
              >
                {column.name}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {editingColor ? (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  size="small"
                  value={tempColor}
                  onChange={(e) => setTempColor(e.target.value)}
                  placeholder={theme.palette.primary.main}
                  sx={{ 
                    width: 100,
                    '& .MuiInputBase-input': {
                      color: theme.palette.text.primary
                    }
                  }}
                />
                <input
                  type="color"
                  value={tempColor}
                  onChange={(e) => setTempColor(e.target.value)}
                  style={{ width: 40, height: 40, border: 'none', cursor: 'pointer' }}
                />
                <Button size="small" onClick={handleSaveColor}>Save</Button>
                <Button size="small" onClick={() => { setEditingColor(false); setTempColor(column.color); }}>Cancel</Button>
              </Box>
            ) : (
              <>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: column.color || theme.palette.primary.main,
                    borderRadius: 1,
                    cursor: 'pointer',
                    border: `2px solid ${theme.palette.divider}`,
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      opacity: 0.8
                    }
                  }}
                  onClick={() => setEditingColor(true)}
                  title="Click to change color"
                />
              </>
            )}
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={column.has_sub_columns || false}
                onChange={(e) => onToggleSubColumns(column, e.target.checked)}
                size="small"
              />
            }
            label="Sub-columns"
          />

          <IconButton 
            onClick={() => { setExpanded(!expanded); onToggleExpand && onToggleExpand(); }} 
            size="small"
            sx={{ color: theme.palette.text.primary }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>

          <IconButton 
            onClick={() => onDelete(column)} 
            color="error" 
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Box>

        <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip 
            label={`Position: ${column.position}`} 
            size="small"
            variant="outlined"
            sx={{
              borderColor: theme.palette.divider,
              color: theme.palette.text.secondary
            }}
          />
          <Chip 
            label={column.is_active ? 'Active' : 'Inactive'} 
            color={column.is_active ? 'success' : 'default'} 
            size="small"
            variant={column.is_active ? 'filled' : 'outlined'}
            sx={!column.is_active ? {
              borderColor: theme.palette.divider,
              color: theme.palette.text.secondary
            } : {}}
          />
          <Chip 
            label={column.can_create_card ? 'Can Create Cards' : 'No Card Creation'} 
            color={column.can_create_card ? 'primary' : 'default'} 
            size="small"
            variant={column.can_create_card ? 'filled' : 'outlined'}
            sx={!column.can_create_card ? {
              borderColor: theme.palette.divider,
              color: theme.palette.text.secondary
            } : {}}
          />
        </Box>

        {column.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {column.description}
          </Typography>
        )}

        <Collapse in={expanded && column.has_sub_columns}>
          <Box sx={{ 
            mt: 2, 
            pl: 4, 
            borderLeft: `2px solid ${theme.palette.divider}` 
          }}>
            {/* Dynamic Sub-columns (Designation-based) */}
            <Box sx={{ 
              mb: 3, 
              p: 2, 
              bgcolor: theme.palette.mode === 'dark' 
                ? theme.palette.background.default 
                : theme.palette.primary.light + '30',
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
              color: theme.palette.text.primary
            }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: theme.palette.text.primary }}>
                Dynamic Sub-columns (User-based)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select designations to automatically generate sub-columns from users with those designations
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: theme.palette.text.secondary }}>
                  Select Designations
                </InputLabel>
                <Select
                  multiple
                  value={column.sub_column_designations || []}
                  onChange={(e) => {
                    const selectedDesignations = e.target.value;
                    onEdit({ ...column, sub_column_designations: selectedDesignations });
                  }}
                  input={<OutlinedInput label="Select Designations" />}
                  sx={{
                    '& .MuiSelect-select': {
                      color: theme.palette.text.primary
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.divider
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main
                    }
                  }}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={value} 
                          size="small"
                          sx={{
                            bgcolor: theme.palette.mode === 'dark' 
                              ? theme.palette.primary.dark 
                              : theme.palette.primary.light,
                            color: theme.palette.mode === 'dark' 
                              ? theme.palette.primary.contrastText 
                              : theme.palette.primary.contrastText
                          }}
                        />
                      ))}
                    </Box>
                  )}
                >
                  {DESIGNATIONS.map((designation) => (
                    <MenuItem key={designation} value={designation}>
                      {designation}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {(column.sub_column_designations || []).length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Sub-columns will be generated from users with: {column.sub_column_designations.join(', ')}
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Static Sub-columns */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary }}>
                Static Sub-columns
              </Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => onAddSubColumn(column)}
              >
                Add Static Sub-column
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              Static sub-columns appear first, followed by dynamic user-based sub-columns
            </Typography>

            {column.sub_columns && column.sub_columns.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {column.sub_columns.map((subCol, subIndex) => (
                  <Paper 
                    key={subCol.id || subIndex}
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      bgcolor: theme.palette.mode === 'dark' 
                        ? theme.palette.background.default 
                        : theme.palette.grey[50],
                      border: `1px solid ${theme.palette.divider}`,
                      color: theme.palette.text.primary
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <TextField
                        size="small"
                        label="ID"
                        value={subCol.id}
                        onChange={(e) => onEditSubColumn(column, subCol, { id: e.target.value })}
                        sx={{ 
                          width: 150,
                          '& .MuiInputBase-input': {
                            color: theme.palette.text.primary
                          },
                          '& .MuiInputLabel-root': {
                            color: theme.palette.text.secondary
                          }
                        }}
                      />
                      <TextField
                        size="small"
                        label="Name"
                        value={subCol.name}
                        onChange={(e) => onEditSubColumn(column, subCol, { name: e.target.value })}
                        sx={{ 
                          flex: 1,
                          '& .MuiInputBase-input': {
                            color: theme.palette.text.primary
                          },
                          '& .MuiInputLabel-root': {
                            color: theme.palette.text.secondary
                          }
                        }}
                      />
                      <TextField
                        size="small"
                        label="Position"
                        type="number"
                        value={subCol.position}
                        onChange={(e) => onEditSubColumn(column, subCol, { position: parseInt(e.target.value) || 0 })}
                        sx={{ 
                          width: 100,
                          '& .MuiInputBase-input': {
                            color: theme.palette.text.primary
                          },
                          '& .MuiInputLabel-root': {
                            color: theme.palette.text.secondary
                          }
                        }}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={subCol.is_active !== false}
                            onChange={(e) => onEditSubColumn(column, subCol, { is_active: e.target.checked })}
                            size="small"
                          />
                        }
                        label="Active"
                        sx={{
                          '& .MuiFormControlLabel-label': {
                            color: theme.palette.text.primary
                          }
                        }}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={subCol.is_restricted || false}
                            onChange={(e) => onEditSubColumn(column, subCol, { is_restricted: e.target.checked })}
                            size="small"
                          />
                        }
                        label="Restricted"
                        sx={{
                          '& .MuiFormControlLabel-label': {
                            color: theme.palette.text.primary
                          }
                        }}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={subCol.has_search || false}
                            onChange={(e) => onEditSubColumn(column, subCol, { has_search: e.target.checked })}
                            size="small"
                          />
                        }
                        label="Search"
                        sx={{
                          '& .MuiFormControlLabel-label': {
                            color: theme.palette.text.primary
                          }
                        }}
                      />
                      <IconButton
                        onClick={() => onDeleteSubColumn(column, subCol)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                No sub-columns. Click "Add Sub-column" to add one.
              </Typography>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
      )}
    </Draggable>
  );
}

const KanbanColumns = () => {
  const theme = useTheme();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [migrationReport, setMigrationReport] = useState(null);
  const [showMigrationReport, setShowMigrationReport] = useState(false);

  // Fetch default template
  useEffect(() => {
    fetchTemplate();
  }, []);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await columnTemplateApi.getDefault();
      if (response.data?.status === 'success' && response.data.data?.template) {
        setTemplate(response.data.data.template);
        setError('');
      } else {
        // No template exists, create a default one
        await createDefaultTemplate();
      }
    } catch (err) {
      console.error('Error fetching template:', err);
      if (err.response?.status === 401) {
        // Authentication error
        const errorMessage = 'Authentication required. Please log in as admin.';
        setError(errorMessage);
        toast.error(errorMessage);
      } else if (err.response?.status === 404) {
        // No template exists, create a default one
        await createDefaultTemplate();
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load column template';
        setError(errorMessage);
        toast.error(`Failed to load column template: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const createDefaultTemplate = async () => {
    const defaultTemplate = {
      name: 'Default Kanban Columns',
      columns: [
        { name: 'To Do', color: theme.palette.primary.main, position: 0, is_active: true, can_create_card: true, has_sub_columns: false, sub_columns: [] },
        { name: 'In Progress', color: theme.palette.info.main, position: 1, is_active: true, can_create_card: false, has_sub_columns: false, sub_columns: [] },
        { name: 'Done', color: theme.palette.success.main, position: 2, is_active: true, can_create_card: false, has_sub_columns: false, sub_columns: [] }
      ],
      is_default: true
    };

    try {
      setLoading(true);
      const response = await columnTemplateApi.create(defaultTemplate);
      if (response.data?.status === 'success' && response.data.data?.template) {
        setTemplate(response.data.data.template);
        setError('');
        toast.success('Default template created successfully');
      } else {
        setError('Failed to create default template: Invalid response');
        toast.error('Failed to create default template');
      }
    } catch (err) {
      console.error('Error creating default template:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create default template';
      setError(`Failed to create default template: ${errorMessage}`);
      toast.error(`Failed to create default template: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (destination.index === source.index) {
      return;
    }

    const newColumns = Array.from(template.columns);
    const [reorderedColumn] = newColumns.splice(source.index, 1);
    newColumns.splice(destination.index, 0, reorderedColumn);

    // Update positions
    newColumns.forEach((col, index) => {
      col.position = index;
    });

    setTemplate({ ...template, columns: newColumns });
  };

  const handleAddColumn = () => {
    const newColumn = {
      name: `New Column ${template.columns.length + 1}`,
      color: theme.palette.primary.main,
      position: template.columns.length,
      is_active: true,
      can_create_card: true,
      has_sub_columns: false,
      sub_columns: []
    };
    setTemplate({ ...template, columns: [...template.columns, newColumn] });
  };

  const handleEditColumn = (updatedColumn) => {
    const newColumns = template.columns.map(col =>
      (col._id || col.id) === (updatedColumn._id || updatedColumn.id) ? updatedColumn : col
    );
    setTemplate({ ...template, columns: newColumns });
  };

  const handleDeleteColumn = (columnToDelete) => {
    if (template.columns.length <= 1) {
      toast.error('Cannot delete the last column');
      return;
    }
    const newColumns = template.columns.filter(
      col => (col._id || col.id) !== (columnToDelete._id || columnToDelete.id)
    );
    // Reorder positions
    newColumns.forEach((col, index) => {
      col.position = index;
    });
    setTemplate({ ...template, columns: newColumns });
  };

  const handleToggleSubColumns = (column, hasSubColumns) => {
    const updatedColumn = {
      ...column,
      has_sub_columns: hasSubColumns,
      sub_columns: hasSubColumns ? (column.sub_columns || []) : []
    };
    handleEditColumn(updatedColumn);
  };

  const handleAddSubColumn = (parentColumn) => {
    const newSubColumn = {
      id: `sub-${Date.now()}`,
      name: 'New Sub-column',
      position: (parentColumn.sub_columns || []).length,
      is_active: true,
      is_restricted: false,
      has_search: false
    };
    const updatedColumn = {
      ...parentColumn,
      sub_columns: [...(parentColumn.sub_columns || []), newSubColumn]
    };
    handleEditColumn(updatedColumn);
  };

  const handleEditSubColumn = (parentColumn, subColumn, updates) => {
    const updatedSubColumns = (parentColumn.sub_columns || []).map(sub =>
      (sub.id || sub._id) === (subColumn.id || subColumn._id) ? { ...sub, ...updates } : sub
    );
    const updatedColumn = {
      ...parentColumn,
      sub_columns: updatedSubColumns
    };
    handleEditColumn(updatedColumn);
  };

  const handleDeleteSubColumn = (parentColumn, subColumnToDelete) => {
    const updatedSubColumns = (parentColumn.sub_columns || []).filter(
      sub => (sub.id || sub._id) !== (subColumnToDelete.id || subColumnToDelete._id)
    );
    // Reorder positions
    updatedSubColumns.forEach((sub, index) => {
      sub.position = index;
    });
    const updatedColumn = {
      ...parentColumn,
      sub_columns: updatedSubColumns
    };
    handleEditColumn(updatedColumn);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const templateData = {
        name: template.name,
        columns: template.columns,
        is_default: template.is_default
      };

      let response;
      if (template._id) {
        response = await columnTemplateApi.update(template._id, templateData);
      } else {
        response = await columnTemplateApi.create(templateData);
      }

      if (response.data?.status === 'success') {
        setTemplate(response.data.data.template);
        setSnackbar({ open: true, message: 'Template saved successfully', severity: 'success' });
        toast.success('Template saved successfully');
      }
    } catch (err) {
      console.error('Error saving template:', err);
      setSnackbar({ open: true, message: 'Failed to save template', severity: 'error' });
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyToAllBoards = async () => {
    try {
      setSaving(true);
      const response = await columnTemplateApi.applyToAllBoards(template._id);
      if (response.data?.status === 'success') {
        const migrationData = response.data.data.migration_report;
        
        // Store migration report and show it
        setMigrationReport(migrationData);
        setShowMigrationReport(true);
        setApplyDialogOpen(false);
        
        // Show success message with migration summary
        const totalCards = (migrationData?.total_cards_migrated || 0) + (migrationData?.total_cards_orphaned || 0);
        const message = `Template applied to ${response.data.data.updated_count} boards. ${migrationData?.total_cards_migrated || 0} cards migrated, ${migrationData?.total_cards_orphaned || 0} cards moved to default column.`;
        
        setSnackbar({ 
          open: true, 
          message: message, 
          severity: 'success' 
        });
        toast.success(message);
        
        if (migrationData?.total_cards_orphaned > 0) {
          toast(`⚠️ ${migrationData.total_cards_orphaned} cards were moved to default column because their original columns were deleted.`, {
            icon: '⚠️',
            duration: 8000
          });
        }
      }
    } catch (err) {
      console.error('Error applying template:', err);
      setSnackbar({ open: true, message: 'Failed to apply template', severity: 'error' });
      toast.error('Failed to apply template');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        p: 3,
        minHeight: '100vh'
      }}>
        <Typography sx={{ color: theme.palette.text.primary }}>Loading...</Typography>
      </Box>
    );
  }

  if (!template && !loading) {
    return (
      <Box sx={{ 
        p: 3,
        minHeight: '100vh'
      }}>
        {error && (
          <Alert severity={error.includes('Authentication') ? 'error' : 'warning'} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {!error && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No template found. Click the button below to create a default template.
          </Alert>
        )}
        <Button
          variant="contained"
          onClick={createDefaultTemplate}
          disabled={loading}
          startIcon={<AddIcon />}
          size="large"
        >
          {loading ? 'Creating...' : 'Create Default Template'}
        </Button>
        {error && error.includes('Authentication') && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info">
              Make sure you are logged in as an admin user.
            </Alert>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 3,
      minHeight: '100vh'
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: theme.palette.text.primary }}>
          Kanban Column Templates
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setApplyDialogOpen(true)}
            disabled={!template._id}
          >
            Apply to All Boards
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Box>

      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 3,
          border: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.primary
        }}>
        <TextField
          fullWidth
          label="Template Name"
          value={template.name}
          onChange={(e) => setTemplate({ ...template, name: e.target.value })}
          sx={{ 
            mb: 2,
            '& .MuiInputBase-input': {
              color: theme.palette.text.primary
            },
            '& .MuiInputLabel-root': {
              color: theme.palette.text.secondary
            }
          }}
        />
        <Chip 
          label={template.is_default ? 'Default Template' : 'Not Default'} 
          color={template.is_default ? 'primary' : 'default'} 
          variant={template.is_default ? 'filled' : 'outlined'}
          sx={{ 
            mb: 2,
            ...(template.is_default ? {} : {
              borderColor: theme.palette.divider,
              color: theme.palette.text.secondary
            })
          }}
        />
      </Paper>

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
          Columns ({template.columns.length})
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddColumn}
        >
          Add Column
        </Button>
      </Box>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="columns">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {template.columns.map((column, index) => (
                <SortableColumnItem
                  key={column._id || column.id || `col-${index}`}
                  column={column}
                  index={index}
                  onEdit={handleEditColumn}
                  onDelete={handleDeleteColumn}
                  onToggleSubColumns={handleToggleSubColumns}
                  onAddSubColumn={handleAddSubColumn}
                  onEditSubColumn={handleEditSubColumn}
                  onDeleteSubColumn={handleDeleteSubColumn}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Dialog open={applyDialogOpen} onClose={() => setApplyDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ color: theme.palette.text.primary }}>
          Apply Template to All Boards
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.text.primary }}>
              Important: This action will affect all boards
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
              This will update all existing boards to use this column template. Existing cards will be automatically migrated to matching columns.
            </Typography>
          </Alert>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.text.primary }}>
              What will happen:
            </Typography>
            <Typography variant="body2" component="div" sx={{ color: theme.palette.text.primary }}>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>All boards will get the new column structure from this template</li>
                <li>Cards will be automatically moved to columns with matching names</li>
                <li>If a column is deleted, its cards will be moved to the first available column</li>
                <li>Sub-columns will be preserved if they exist in the new structure</li>
              </ul>
            </Typography>
          </Box>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
              A detailed migration report will be shown after the operation completes.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplyDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleApplyToAllBoards} variant="contained" color="primary" disabled={saving}>
            {saving ? 'Applying...' : 'Apply Template'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Migration Report Dialog */}
      <Dialog open={showMigrationReport} onClose={() => setShowMigrationReport(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ color: theme.palette.text.primary }}>
          Migration Report
        </DialogTitle>
        <DialogContent>
          {migrationReport && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                  Template applied successfully!
                </Typography>
              </Alert>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1, color: theme.palette.text.primary }}>
                  Summary
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip 
                    label={`${migrationReport.total_cards_migrated || 0} Cards Migrated`} 
                    color="success" 
                    size="small"
                  />
                  <Chip 
                    label={`${migrationReport.total_cards_orphaned || 0} Cards Moved to Default`} 
                    color={migrationReport.total_cards_orphaned > 0 ? "warning" : "default"} 
                    size="small"
                  />
                  <Chip 
                    label={`${migrationReport.board_reports?.length || 0} Boards Updated`} 
                    color="primary" 
                    size="small"
                  />
                </Box>
              </Box>

              {migrationReport.total_cards_orphaned > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                    {migrationReport.total_cards_orphaned} cards were moved to the default column because their original columns were deleted. Please review these cards.
                  </Typography>
                </Alert>
              )}

              {migrationReport.board_reports && migrationReport.board_reports.length > 0 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 1, color: theme.palette.text.primary }}>
                    Board Details
                  </Typography>
                  {migrationReport.board_reports.map((report, index) => (
                    <Paper 
                      key={index}
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        mb: 1,
                        border: `1px solid ${theme.palette.divider}`,
                        color: theme.palette.text.primary
                      }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.text.primary }}>
                        {report.board_name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label={`${report.cards_migrated} migrated`} size="small" color="success" />
                        <Chip 
                          label={`${report.cards_orphaned} orphaned`} 
                          size="small" 
                          color={report.cards_orphaned > 0 ? "warning" : "default"}
                          variant={report.cards_orphaned > 0 ? "filled" : "outlined"}
                          sx={report.cards_orphaned === 0 ? {
                            borderColor: theme.palette.divider,
                            color: theme.palette.text.secondary
                          } : {}}
                        />
                        <Chip 
                          label={`${report.columns_matched} columns matched`} 
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: theme.palette.divider,
                            color: theme.palette.text.secondary
                          }}
                        />
                        {report.columns_deleted > 0 && (
                          <Chip label={`${report.columns_deleted} columns deleted`} size="small" color="error" />
                        )}
                      </Box>
                      {report.deleted_column_names && report.deleted_column_names.length > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Deleted columns: {report.deleted_column_names.join(', ')}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMigrationReport(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default KanbanColumns;

