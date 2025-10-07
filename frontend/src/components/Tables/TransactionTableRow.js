import {
  Avatar,
  Badge,
  Button,
  Flex,
  Td,
  Text,
  Tr,
  useColorModeValue,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  VStack,
  HStack,
  Box,
  Image,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay
} from "@chakra-ui/react";
import React, { useRef } from "react";
import { FaWallet, FaArrowUp, FaArrowDown, FaEllipsisV, FaEye, FaEdit, FaTrash, FaExpand } from "react-icons/fa";
import TransactionForm from "components/Forms/TransactionForm";
import { useTransactions } from "contexts/TransactionContext";

function TransactionTableRow(props) {
  const { transaction, isLast } = props;
  const textColor = useColorModeValue("gray.500", "white");
  const titleColor = useColorModeValue("gray.700", "white");
  const bgStatus = useColorModeValue("gray.400", "navy.900");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  
  // Modal controls
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  const cancelRef = useRef();
  
  // Context and toast
  const { updateTransaction, deleteTransaction } = useTransactions();
  const toast = useToast();

  // Get badge color based on type
  const getBadgeColor = (type) => {
    return type === 'income' ? 'green' : 'red';
  };

  // Get transaction icon based on type
  const getTransactionIcon = (type) => {
    return type === 'income' ? FaArrowUp : FaArrowDown;
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Format amount for display
  const formatAmount = (amount) => {
    return `${transaction.type === 'income' ? '+' : '-'}$${parseFloat(amount).toFixed(2)}`;
  };

  // Handle edit transaction
  const handleEditSubmit = async (formData) => {
    try {
      await updateTransaction(transaction.id, formData);
      toast({
        title: 'Transaction Updated',
        description: 'Transaction has been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onEditClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update transaction',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle delete transaction
  const handleDelete = async () => {
    try {
      await deleteTransaction(transaction.id);
      toast({
        title: 'Transaction Deleted',
        description: 'Transaction has been deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onDeleteClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete transaction',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Get image source for preview
  const getImageSource = () => {
    if (!transaction.attachment) return null;
    
    if (typeof transaction.attachment === 'string') {
      // Check if it's already a full URL (Supabase URL)
      if (transaction.attachment.startsWith('http')) {
        return transaction.attachment;
      }
      // Legacy local file path
      return `http://localhost:5001${transaction.attachment}`;
    } else if (transaction.attachment instanceof File) {
      return URL.createObjectURL(transaction.attachment);
    } else if (transaction.attachment.url || transaction.attachment.path) {
      return transaction.attachment.url || transaction.attachment.path;
    }
    return null;
  };

  // Check if attachment is an image
  const isImageAttachment = () => {
    if (!transaction.attachment) return false;
    
    if (typeof transaction.attachment === 'string') {
      return transaction.attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    } else if (transaction.attachment instanceof File) {
      return transaction.attachment.type.startsWith('image/');
    } else if (transaction.attachment.name) {
      return transaction.attachment.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    }
    return false;
  };

  return (
    <Tr>
      <Td
        minWidth={{ sm: "250px" }}
        pl="0px"
        borderColor={borderColor}
        borderBottom={isLast ? "none" : null}
      >
        <Flex align="center" py=".8rem" minWidth="100%" flexWrap="nowrap">
          <Avatar 
            icon={<Icon as={getTransactionIcon(transaction.type)} />}
            bg={transaction.type === 'income' ? 'green.400' : 'red.400'}
            color="white"
            w="50px" 
            borderRadius="12px" 
            me="18px" 
          />
          <Flex direction="column">
            <Text
              fontSize="md"
              color={titleColor}
              fontWeight="bold"
              minWidth="100%"
            >
              {transaction.id}
            </Text>
            <Text fontSize="sm" color="gray.400" fontWeight="normal">
              {transaction.paymentMethod}
            </Text>
          </Flex>
        </Flex>
      </Td>

      <Td borderColor={borderColor} borderBottom={isLast ? "none" : null}>
        <Badge
          bg={transaction.type === 'income' ? "green.400" : "red.400"}
          color="white"
          fontSize="16px"
          p="3px 10px"
          borderRadius="8px"
        >
          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
        </Badge>
      </Td>

      <Td borderColor={borderColor} borderBottom={isLast ? "none" : null}>
        <Text 
          fontSize="md" 
          color={transaction.type === 'income' ? 'green.500' : 'red.500'} 
          fontWeight="bold"
        >
          {formatAmount(transaction.amount)}
        </Text>
      </Td>

      <Td borderColor={borderColor} borderBottom={isLast ? "none" : null}>
        <Text fontSize="md" color={textColor} fontWeight="bold">
          {transaction.category}
        </Text>
      </Td>

      <Td borderColor={borderColor} borderBottom={isLast ? "none" : null}>
        <Text fontSize="md" color={textColor} fontWeight="bold" pb=".5rem">
          {formatDate(transaction.date)}
        </Text>
      </Td>

      <Td borderColor={borderColor} borderBottom={isLast ? "none" : null}>
        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="Actions"
            icon={<FaEllipsisV />}
            variant="ghost"
            size="sm"
            color="gray.400"
            _hover={{ color: textColor, bg: useColorModeValue("gray.100", "gray.600") }}
          />
          <MenuList>
            <MenuItem icon={<FaEye />} fontSize="sm" onClick={onViewOpen}>
              View
            </MenuItem>
            <MenuItem icon={<FaEdit />} fontSize="sm" onClick={onEditOpen}>
              Edit
            </MenuItem>
            <MenuItem icon={<FaTrash />} fontSize="sm" color="red.500" onClick={onDeleteOpen}>
              Delete
            </MenuItem>
          </MenuList>
        </Menu>
      </Td>

      {/* View Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Transaction Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Text fontWeight="bold">Type:</Text>
                <Badge
                  bg={transaction.type === 'income' ? "green.400" : "red.400"}
                  color="white"
                  fontSize="14px"
                  p="2px 8px"
                  borderRadius="6px"
                >
                  {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                </Badge>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontWeight="bold">Amount:</Text>
                <Text 
                  fontSize="lg" 
                  color={transaction.type === 'income' ? 'green.500' : 'red.500'} 
                  fontWeight="bold"
                >
                  {formatAmount(transaction.amount)}
                </Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontWeight="bold">Category:</Text>
                <Text>{transaction.category}</Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontWeight="bold">Date:</Text>
                <Text>{formatDate(transaction.date)}</Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontWeight="bold">Payment Method:</Text>
                <Text>{transaction.paymentMethod || 'Not specified'}</Text>
              </HStack>
              
              <VStack align="stretch">
                <Text fontWeight="bold">Notes:</Text>
                <Box 
                  p={3} 
                  bg={useColorModeValue("gray.50", "gray.700")} 
                  borderRadius="md"
                  minH="60px"
                >
                  <Text>{transaction.notes || 'No notes available'}</Text>
                </Box>
              </VStack>
              
              <VStack align="stretch">
                <HStack justify="space-between" align="center">
                  <Text fontWeight="bold">Photo/Attachment:</Text>
                  {transaction.attachment && isImageAttachment() && (
                    <Button
                      size="sm"
                      leftIcon={<FaExpand />}
                      colorScheme="blue"
                      variant="outline"
                      onClick={onPreviewOpen}
                    >
                      Preview
                    </Button>
                  )}
                </HStack>
                <Box 
                  p={3} 
                  bg={useColorModeValue("gray.50", "gray.700")} 
                  borderRadius="md"
                >
                  {transaction.attachment ? (
                    typeof transaction.attachment === 'string' ? (
                      <Image 
                        src={getImageSource()} 
                        alt="Transaction attachment" 
                        maxH="300px" 
                        maxW="100%"
                        objectFit="contain"
                        borderRadius="md"
                        cursor={isImageAttachment() ? "pointer" : "default"}
                        onClick={isImageAttachment() ? onPreviewOpen : undefined}
                        fallback={
                          <Box>
                            <Text>Unable to load image</Text>
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              URL: {getImageSource()}
                            </Text>
                          </Box>
                        }
                      />
                    ) : transaction.attachment instanceof File ? (
                      <Image 
                        src={URL.createObjectURL(transaction.attachment)} 
                        alt="Transaction attachment" 
                        maxH="300px" 
                        maxW="100%"
                        objectFit="contain"
                        borderRadius="md"
                        cursor={isImageAttachment() ? "pointer" : "default"}
                        onClick={isImageAttachment() ? onPreviewOpen : undefined}
                        fallback={<Text>Unable to load image</Text>}
                      />
                    ) : transaction.attachment.name ? (
                      transaction.attachment.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <Image 
                          src={transaction.attachment.url || transaction.attachment.path || transaction.attachment} 
                          alt="Transaction attachment" 
                          maxH="300px" 
                          maxW="100%"
                          objectFit="contain"
                          borderRadius="md"
                          cursor="pointer"
                          onClick={onPreviewOpen}
                          fallback={
                            <Box>
                              <Text mb={2}>📷 Image file: {transaction.attachment.name}</Text>
                              <Text fontSize="sm" color="gray.500">
                                Image preview not available
                              </Text>
                            </Box>
                          }
                        />
                      ) : (
                        <Box>
                          <Text>📎 File attached: {transaction.attachment.name}</Text>
                          <Text fontSize="sm" color="gray.500" mt={1}>
                            File type: {transaction.attachment.name.split('.').pop()?.toUpperCase() || 'Unknown'}
                          </Text>
                        </Box>
                      )
                    ) : (
                      <Box>
                        <Text>📎 Attachment available</Text>
                        <Text fontSize="sm" color="gray.500" mt={1}>
                          Attachment data: {JSON.stringify(transaction.attachment)}
                        </Text>
                      </Box>
                    )
                  ) : (
                    <Text color="gray.500">No attachment</Text>
                  )}
                </Box>
              </VStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Transaction</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <TransactionForm
              initialData={transaction}
              onSubmit={handleEditSubmit}
              onCancel={onEditClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Image Preview Modal */}
      <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} size="full">
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg="transparent" boxShadow="none">
          <ModalCloseButton 
            color="white" 
            size="lg" 
            top="20px" 
            right="20px" 
            zIndex="1000"
            bg="blackAlpha.600"
            _hover={{ bg: "blackAlpha.800" }}
          />
          <ModalBody 
            display="flex" 
            alignItems="center" 
            justifyContent="center" 
            p={0}
            minH="100vh"
          >
            {transaction.attachment && isImageAttachment() && (
              <Image 
                src={getImageSource()} 
                alt="Transaction attachment preview" 
                maxH="95vh"
                maxW="95vw"
                objectFit="contain"
                borderRadius="md"
                fallback={
                  <Box 
                    bg="white" 
                    p={8} 
                    borderRadius="md" 
                    textAlign="center"
                  >
                    <Text>Unable to load image for preview</Text>
                  </Box>
                }
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Transaction
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this transaction? This action cannot be undone.
              <Box mt={3} p={3} bg={useColorModeValue("gray.50", "gray.700")} borderRadius="md">
                <Text><strong>Amount:</strong> {formatAmount(transaction.amount)}</Text>
                <Text><strong>Category:</strong> {transaction.category}</Text>
                <Text><strong>Date:</strong> {formatDate(transaction.date)}</Text>
              </Box>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Tr>
  );
}

export default TransactionTableRow;
