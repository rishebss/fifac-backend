// routes/leadRoutes.js
import express from 'express';
import { createLead, getLeads, getLeadById, updateLead, deleteLead } from '../models/leadModels.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// GET /api/leads - Get all leads with pagination
router.get('/',authenticateToken, async (req, res) => {
  try {
    // OPTIMIZED: Add pagination support
    const { limit = 100, offset = 0, orderBy = 'createdAt', orderDirection = 'desc' } = req.query;
    
    const leads = await getLeads(
      parseInt(limit), 
      parseInt(offset), 
      orderBy, 
      orderDirection
    );
    
    // Add caching headers for better performance
    res.set({
      'Cache-Control': 'public, max-age=300', // 5 minutes
      'ETag': `leads-${leads.length}-${Date.now()}`
    });
    
    res.json({ 
      success: true,
      message: 'Leads retrieved successfully!',
      data: leads,
      meta: {
        count: leads.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error getting leads:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve leads from the database.' 
    });
  }
});

// GET /api/leads/:id - Get a single lead by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const lead = await getLeadById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ 
        success: false,
        error: 'Lead not found.' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Lead retrieved successfully!',
      data: lead 
    });
  } catch (error) {
    console.error('Error getting lead:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve the lead.' 
    });
  }
});

// POST /api/leads - Create a new lead
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('Received POST request to create lead:', req.body);
    
    const { name,phone } = req.body;
    
    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({ 
        success: false,
        error: 'Name and phone are required fields.' 
      });
    }
    
    const newLead = await createLead({ name, phone, source });
    
    res.status(201).json({ 
      success: true,
      message: 'Lead created successfully!', 
      data: newLead 
    });
    
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create a new lead in the database.' 
    });
  }
});

// PUT /api/leads/:id - Update a lead
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updatedLead = await updateLead(req.params.id, req.body);
    res.json({ 
      success: true,
      message: 'Lead updated successfully!',
      data: updatedLead 
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update the lead.' 
    });
  }
});

// DELETE /api/leads/:id - Delete a lead
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await deleteLead(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        error: 'Lead not found.' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Lead deleted successfully!' 
    });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete the lead.' 
    });
  }
});

export default router;