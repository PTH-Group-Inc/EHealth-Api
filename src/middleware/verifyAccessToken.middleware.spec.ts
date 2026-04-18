import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, optionalVerifyAccessToken } from './verifyAccessToken.middleware';
import { TokenUtil } from '../utils/token.util';

// Mock TokenUtil
jest.mock('../utils/token.util', () => ({
  TokenUtil: {
    verifyAccessToken: jest.fn(),
  },
}));

describe('verifyAccessToken.middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('verifyAccessToken (Required)', () => {
    it('should return 401 if authorization header is missing', () => {
      verifyAccessToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'AUTH_401',
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header does not start with Bearer', () => {
      mockRequest.headers!.authorization = 'Basic token123';
      verifyAccessToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token is "null"', () => {
      mockRequest.headers!.authorization = 'Bearer null';
      verifyAccessToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next and set req.auth if token is valid', () => {
      mockRequest.headers!.authorization = 'Bearer valid.token.here';
      const mockPayload = { sub: 'user-id-123', roles: ['ADMIN'], sessionId: 'session-123' };
      
      (TokenUtil.verifyAccessToken as jest.Mock).mockReturnValue(mockPayload);

      verifyAccessToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(TokenUtil.verifyAccessToken).toHaveBeenCalledWith('valid.token.here');
      expect((mockRequest as any).auth).toEqual({
        user_id: 'user-id-123',
        roles: ['ADMIN'],
        sessionId: 'session-123',
      });
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 401 if token verification throws an error', () => {
      mockRequest.headers!.authorization = 'Bearer invalid.token.here';
      (TokenUtil.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      verifyAccessToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('optionalVerifyAccessToken (Optional)', () => {
    it('should call next if authorization header is missing', () => {
      optionalVerifyAccessToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect((mockRequest as any).auth).toBeUndefined();
    });

    it('should call next if authorization header does not start with Bearer', () => {
      mockRequest.headers!.authorization = 'Basic token123';
      optionalVerifyAccessToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect((mockRequest as any).auth).toBeUndefined();
    });

    it('should set req.auth and call next if a valid token is provided', () => {
      mockRequest.headers!.authorization = 'Bearer valid.token.here';
      const mockPayload = { sub: 'user-id-123', roles: ['GUEST'], sessionId: 'session-999' };
      
      (TokenUtil.verifyAccessToken as jest.Mock).mockReturnValue(mockPayload);

      optionalVerifyAccessToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect((mockRequest as any).auth).toEqual({
        user_id: 'user-id-123',
        roles: ['GUEST'],
        sessionId: 'session-999',
      });
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 401 if an invalid token is provided', () => {
      // Even if it's optional, if they provide a token and it's invalid, they should be rejected
      mockRequest.headers!.authorization = 'Bearer invalid.token.here';
      (TokenUtil.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      optionalVerifyAccessToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
