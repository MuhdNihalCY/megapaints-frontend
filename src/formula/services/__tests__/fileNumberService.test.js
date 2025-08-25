import { FileNumberService } from '../fileNumberService';

// Mock the API calls
jest.mock('../../utils/api', () => ({
  get: jest.fn()
}));

describe('FileNumberService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('incrementAlphabetic', () => {
    it('should increment single letter suffixes correctly', () => {
      expect(FileNumberService.incrementAlphabetic('A')).toBe('B');
      expect(FileNumberService.incrementAlphabetic('B')).toBe('C');
      expect(FileNumberService.incrementAlphabetic('Z')).toBe('AA');
    });

    it('should increment multi-letter suffixes correctly', () => {
      expect(FileNumberService.incrementAlphabetic('AA')).toBe('AB');
      expect(FileNumberService.incrementAlphabetic('AZ')).toBe('BA');
      expect(FileNumberService.incrementAlphabetic('ZZ')).toBe('AAA');
    });
  });

  describe('incrementSuffix', () => {
    it('should add suffix to number without suffix', () => {
      expect(FileNumberService.incrementSuffix('100000')).toBe('100000.A');
    });

    it('should increment existing suffix', () => {
      expect(FileNumberService.incrementSuffix('100000.A')).toBe('100000.B');
      expect(FileNumberService.incrementSuffix('100000.Z')).toBe('100000.AA');
    });

    it('should handle invalid input gracefully', () => {
      expect(FileNumberService.incrementSuffix('invalid')).toBe('invalid');
    });
  });

  describe('formulaFileFormat', () => {
    const mockSubcategories = [
      { _id: 'sub1', SubCategory_Id: 'sub1', Suffix: 'ABC' },
      { _id: 'sub2', SubCategory_Id: 'sub2', Suffix: 'XYZ' }
    ];

    const mockAdditives = [
      { _id: 'add1', Additive_Id: 'add1', Suffix: 'XY' },
      { _id: 'add2', Additive_Id: 'add2', Suffix: 'UV' }
    ];

    it('should format basic file number', () => {
      const result = FileNumberService.formulaFileFormat(
        '100000',
        'sub1',
        5,
        'add1',
        10,
        mockSubcategories,
        mockAdditives
      );
      expect(result).toBe('100000-ABC-05-XY10');
    });

    it('should handle missing subcategory suffix', () => {
      const result = FileNumberService.formulaFileFormat(
        '100000',
        'unknown',
        5,
        'add1',
        10,
        mockSubcategories,
        mockAdditives
      );
      expect(result).toBe('100000-05-XY10');
    });

    it('should handle missing additive', () => {
      const result = FileNumberService.formulaFileFormat(
        '100000',
        'sub1',
        5,
        null,
        null,
        mockSubcategories,
        mockAdditives
      );
      expect(result).toBe('100000-ABC-05');
    });

    it('should handle single digit gloss and percentage', () => {
      const result = FileNumberService.formulaFileFormat(
        '100000',
        'sub1',
        5,
        'add1',
        5,
        mockSubcategories,
        mockAdditives
      );
      expect(result).toBe('100000-ABC-05-XY05');
    });
  });

  describe('generateFileNo', () => {
    it('should generate new file number when no existing formulas', async () => {
      // Mock empty formulas response
      const mockApi = require('../../utils/api');
      mockApi.get.mockResolvedValue({
        data: { formulas: [] }
      });

      const data = {
        SubCategory: 'sub1',
        gloss: 5,
        additiveId: 'add1',
        AdditivePercentage: 10,
        subcategories: [],
        additives: []
      };

      const result = await FileNumberService.generateFileNo(data, true);
      
      expect(result.labelFileNo).toBe(100000);
      expect(result.fileNo).toBe('100000');
    });

    it('should increment from existing file numbers', async () => {
      // Mock existing formulas response
      const mockApi = require('../../utils/api');
      mockApi.get.mockResolvedValue({
        data: { 
          formulas: [
            { FileNo: '100000', labelFileNo: '100000' },
            { FileNo: '99999', labelFileNo: '99999' }
          ] 
        }
      });

      const data = {
        SubCategory: 'sub1',
        gloss: 5,
        additiveId: 'add1',
        AdditivePercentage: 10,
        subcategories: [],
        additives: []
      };

      const result = await FileNumberService.generateFileNo(data, true);
      
      expect(result.labelFileNo).toBe(100001);
      expect(result.fileNo).toBe('100001');
    });
  });
});
