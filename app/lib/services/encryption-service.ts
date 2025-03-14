// app/lib/services/encryption-service.ts
import crypto from 'crypto';

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // Para AES-256
  private static readonly IV_LENGTH = 16;
  private static readonly AUTH_TAG_LENGTH = 16;
  private static readonly SALT_LENGTH = 64;
  private static readonly ITERATIONS = 10000;

  // Usamos a chave secreta do ambiente para derivar a chave de criptografia
  private static getEncryptionKey(salt: Buffer): Buffer {
    if (!process.env.ENCRYPTION_SECRET) {
      throw new Error('Chave de criptografia não configurada');
    }
    
    // PBKDF2 para derivar a chave a partir da chave secreta e do salt
    return crypto.pbkdf2Sync(
      process.env.ENCRYPTION_SECRET,
      salt,
      this.ITERATIONS,
      this.KEY_LENGTH,
      'sha256'
    );
  }

  public static encrypt(text: string, userId: string): string {
    // Geramos um salt único para cada usuário + extra randomness
    const salt = crypto.randomBytes(this.SALT_LENGTH);
    
    // Derivamos a chave de criptografia usando o salt
    const key = this.getEncryptionKey(salt);
    
    // Geramos um IV (vetor de inicialização) único
    const iv = crypto.randomBytes(this.IV_LENGTH);
    
    // Criamos o cipher com o algoritmo, chave e IV
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    
    // Criptografamos o texto
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Obtemos o tag de autenticação
    const authTag = cipher.getAuthTag();
    
    // Combinamos todos os elementos em uma string
    // Formato: salt:iv:authTag:encryptedText
    return Buffer.concat([
      salt,
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ]).toString('base64');
  }

  public static decrypt(encryptedData: string, userId: string): string {
    try {
      // Decodificamos a string base64
      const buffer = Buffer.from(encryptedData, 'base64');
      
      // Extraímos os elementos
      const salt = buffer.subarray(0, this.SALT_LENGTH);
      const iv = buffer.subarray(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
      const authTag = buffer.subarray(
        this.SALT_LENGTH + this.IV_LENGTH,
        this.SALT_LENGTH + this.IV_LENGTH + this.AUTH_TAG_LENGTH
      );
      const encrypted = buffer.subarray(
        this.SALT_LENGTH + this.IV_LENGTH + this.AUTH_TAG_LENGTH
      ).toString('hex');
      
      // Derivamos a chave de criptografia
      const key = this.getEncryptionKey(salt);
      
      // Criamos o decipher
      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      
      // Descriptografamos o texto
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Erro ao descriptografar:', error);
      throw new Error('Falha ao descriptografar os dados');
    }
  }
}