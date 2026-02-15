import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { MessagesService } from '../messages/messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from '../../common/services/ai.service';
import { UserProfileClientService, SpringUserProfile } from '../users/user-profile-client.service';

interface AuthRequest extends Request {
  user: { userId: string; email: string };
}

interface EnrichedParticipant {
  userId: string;
  displayName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  joinedAt: Date;
  lastReadMessageId: string;
  unreadCount: number;
  isMuted: boolean;
  isPinned: boolean;
}

@ApiTags('Conversations')
@ApiBearerAuth('JWT-auth')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  private readonly logger = new Logger(ConversationsController.name);

  constructor(
    private conversationsService: ConversationsService,
    private messagesService: MessagesService,
    private aiService: AiService,
    private userProfileClient: UserProfileClientService,
  ) {}

  @Post('single')
  async createSingleConversation(
    @Request() req: AuthRequest,
    @Body('recipientId') recipientId: string,
  ) {
    return this.conversationsService.createSingleConversation(req.user.userId, recipientId);
  }

  @Post('direct/:userId')
  @ApiOperation({ summary: 'Create or get direct conversation with user' })
  @ApiParam({ name: 'userId', description: 'User ID to start conversation with' })
  async getOrCreateDirectConversation(
    @Request() req: AuthRequest,
    @Param('userId') recipientId: string,
  ) {
    const conversation = await this.conversationsService.createSingleConversation(
      req.user.userId,
      recipientId,
    );
    // Enrich with user details
    const [enrichedConversation] = await this.enrichConversationsWithUserDetails([conversation]);
    // Wrap in ServiceResponseDto format for Flutter client
    return {
      success: true,
      data: enrichedConversation,
    };
  }

  @Post('group')
  async createGroupConversation(
    @Request() req: AuthRequest,
    @Body('name') name: string,
    @Body('participantIds') participantIds: string[],
    @Body('description') description?: string,
  ) {
    return this.conversationsService.createGroupConversation(
      req.user.userId,
      name,
      participantIds,
      description,
    );
  }

  @Get()
  async getUserConversations(@Request() req: AuthRequest) {
    const conversations = await this.conversationsService.getUserConversations(req.user.userId);

    // Enrich participant data with user details (displayName, phoneNumber)
    const enrichedConversations = await this.enrichConversationsWithUserDetails(conversations);

    // Wrap in ServiceResponseDto format for Flutter client
    return {
      success: true,
      data: {
        items: enrichedConversations,
        total: enrichedConversations.length,
        hasMore: false,
      },
    };
  }

  /**
   * Enrich conversations with user details (displayName, phoneNumber) from user-service
   */
  private async enrichConversationsWithUserDetails(conversations: any[]): Promise<any[]> {
    if (!conversations || conversations.length === 0) {
      return conversations;
    }

    try {
      // Collect all unique user IDs from all conversations
      const allUserIds = new Set<string>();
      for (const conv of conversations) {
        if (conv.participants) {
          for (const p of conv.participants) {
            if (p.userId) {
              allUserIds.add(p.userId);
            }
          }
        }
      }

      if (allUserIds.size === 0) {
        return conversations;
      }

      // Fetch user profiles from user-service
      const userIds = Array.from(allUserIds);
      this.logger.log(`Fetching user profiles for ${userIds.length} users: ${userIds.join(', ')}`);

      let userProfiles: SpringUserProfile[] = [];
      try {
        userProfiles = await this.userProfileClient.getUsersByIds(userIds);
        this.logger.log(`Got ${userProfiles.length} user profiles`);
        // Debug: Log phone numbers
        for (const profile of userProfiles) {
          this.logger.log(`User ${profile.id}: displayName=${profile.displayName}, phoneNumber=${profile.phoneNumber}`);
        }
      } catch (error) {
        this.logger.warn(`Failed to fetch user profiles: ${error.message}`);
        // Return conversations without enrichment if user-service fails
        return conversations;
      }

      // Create a map for quick lookup
      const userMap = new Map<string, SpringUserProfile>();
      for (const profile of userProfiles) {
        userMap.set(profile.id, profile);
        // Also map by externalId if available
        if (profile.externalId) {
          userMap.set(profile.externalId, profile);
        }
      }

      // Enrich each conversation's participants
      return conversations.map((conv) => {
        const convObj = conv.toObject ? conv.toObject() : { ...conv };

        if (convObj.participants && Array.isArray(convObj.participants)) {
          convObj.participants = convObj.participants.map((p: any) => {
            const participantUserId = p.userId?.toString() || p.userId;
            const userProfile = userMap.get(participantUserId);

            this.logger.debug(`Enriching participant ${participantUserId}: found=${!!userProfile}, phoneNumber=${userProfile?.phoneNumber}`);

            return {
              ...p,
              userId: participantUserId,
              displayName: userProfile?.displayName || null,
              phoneNumber: userProfile?.phoneNumber || null,
              avatarUrl: userProfile?.avatar || null,
            } as EnrichedParticipant;
          });
        }

        return convObj;
      });
    } catch (error) {
      this.logger.error(`Error enriching conversations: ${error.message}`);
      // Return original conversations if enrichment fails
      return conversations;
    }
  }

  @Get(':id')
  async getConversation(@Param('id') id: string) {
    const conversation = await this.conversationsService.findById(id);
    // Enrich with user details
    const [enrichedConversation] = await this.enrichConversationsWithUserDetails([conversation]);
    return {
      success: true,
      data: enrichedConversation,
    };
  }

  @Put(':id')
  async updateConversation(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() updates: any,
  ) {
    return this.conversationsService.updateConversation(id, req.user.userId, updates);
  }

  @Put(':id/participants')
  async addParticipants(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body('participantIds') participantIds: string[],
  ) {
    return this.conversationsService.addParticipants(id, req.user.userId, participantIds);
  }

  @Delete(':id/participants/:participantId')
  async removeParticipant(
    @Param('id') id: string,
    @Param('participantId') participantId: string,
    @Request() req: AuthRequest,
  ) {
    return this.conversationsService.removeParticipant(id, req.user.userId, participantId);
  }

  @Put(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body('messageId') messageId: string,
  ) {
    await this.conversationsService.markAsRead(id, req.user.userId, messageId);
    return { success: true };
  }

  @Put(':id/mute')
  async toggleMute(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body('isMuted') isMuted: boolean,
  ) {
    await this.conversationsService.toggleMute(id, req.user.userId, isMuted);
    return { success: true };
  }

  @Delete(':id/messages')
  async clearMessages(@Param('id') id: string, @Request() req: AuthRequest) {
    await this.messagesService.clearConversationMessages(id);
    return { success: true };
  }

  @Delete(':id')
  async deleteConversation(@Param('id') id: string, @Request() req: AuthRequest) {
    await this.conversationsService.deleteConversation(id, req.user.userId);
    return { success: true };
  }

  @Put('read-all')
  async markAllAsRead(@Request() req: AuthRequest) {
    await this.conversationsService.markAllAsRead(req.user.userId);
    return { success: true };
  }

  @Get('ai-search')
  async aiSearch(@Request() req: AuthRequest, @Query('query') query: string) {
    if (!query || query.trim() === '') {
      return { results: [], message: 'Query parameter is required' };
    }

    try {
      const conversations = await this.conversationsService.getUserConversations(req.user.userId);
      const results = await this.aiService.searchConversations(
        query,
        conversations,
        req.user.userId,
      );
      return { results, count: results.length };
    } catch (error) {
      return {
        results: [],
        error: error.message,
        message: 'AI search is not available. Please configure OPENAI_API_KEY in your environment.',
      };
    }
  }

  // Message Pinning Endpoints
  @Post(':id/pin/:messageId')
  async pinMessage(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Request() req: AuthRequest,
  ) {
    return this.conversationsService.pinMessage(id, req.user.userId, messageId);
  }

  @Delete(':id/pin/:messageId')
  async unpinMessage(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Request() req: AuthRequest,
  ) {
    return this.conversationsService.unpinMessage(id, req.user.userId, messageId);
  }

  @Get(':id/pinned')
  async getPinnedMessages(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.conversationsService.getPinnedMessages(id, req.user.userId);
  }

  // Disappearing Messages Endpoints
  @Put(':id/disappearing-messages')
  async setDisappearingMessages(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body('timer') timer: number,
  ) {
    return this.conversationsService.setDisappearingMessagesTimer(id, req.user.userId, timer);
  }

  @Get(':id/disappearing-messages')
  async getDisappearingMessagesSettings(@Param('id') id: string) {
    const timer = await this.conversationsService.getDisappearingMessagesTimer(id);
    return {
      enabled: timer > 0,
      timer,
      timerLabel:
        timer === 0
          ? 'Off'
          : timer === 86400
            ? '24 hours'
            : timer === 604800
              ? '7 days'
              : '30 days',
    };
  }
}
