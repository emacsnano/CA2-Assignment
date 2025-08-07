// you can modify the code to suit your needs

// function parseJwt(token) {
//     try {
//         const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
//         const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
//             return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
//         }).join(''));
//         return JSON.parse(jsonPayload);
//     } catch (e) {
//         return null;
//     }
// }

// function fetchProduct(productId) {
//     const token = localStorage.getItem("token");

//     return fetch(`/products/${productId}`, {
//         headers: {
//             Authorization: `Bearer ${token}`
//         }
//     })
//     .then(response => response.json())
//     .then(body => {
//         if (body.error) throw new Error(body.error);
//         const product = body.product;
//         const tbody = document.querySelector("#product-tbody");

//         const row = document.createElement("tr");
//         row.classList.add("product");

//         const nameCell = document.createElement("td");
//         const descriptionCell = document.createElement("td");
//         const unitPriceCell = document.createElement("td");
//         const countryCell = document.createElement("td");
//         const productTypeCell = document.createElement("td");
//         const imageUrlCell = document.createElement("td");
//         const manufacturedOnCell = document.createElement("td");

//         nameCell.textContent = product.name;
//         descriptionCell.textContent = product.description;
//         unitPriceCell.textContent = product.unitPrice;
//         countryCell.textContent = product.country;
//         productTypeCell.textContent = product.productType;
//         imageUrlCell.innerHTML = `<img src="${product.imageUrl}" alt="Product Image">`;
//         manufacturedOnCell.textContent = new Date(product.manufacturedOn).toLocaleString();

//         row.appendChild(nameCell);
//         row.appendChild(descriptionCell);
//         row.appendChild(unitPriceCell);
//         row.appendChild(countryCell);
//         row.appendChild(productTypeCell);
//         row.appendChild(imageUrlCell);
//         row.appendChild(manufacturedOnCell);
//         tbody.appendChild(row);
//     })
//     .catch(error => {
//         console.error(error);
//     });
// }

// function fetchCommentsByProduct(productId) {
//     const token = localStorage.getItem("token");

//     return fetch(`/comments/review?productId=${productId}`, {
//         headers: {
//             Authorization: `Bearer ${token}`
//         }
//     })
//     .then(response => response.json())
//     .then(body => {
//         if (body.error) throw new Error(body.error);

//         // Group comments by reviewId
//         const commentsByReview = {};
//         if (Array.isArray(body.comments)) {
//             body.comments.forEach(comment => {
//                 if (!commentsByReview[comment.reviewId]) {
//                     commentsByReview[comment.reviewId] = [];
//                 }
//                 commentsByReview[comment.reviewId].push(comment);
//             });
//         }
//         return commentsByReview;
//     })
//     .catch(error => {
//         console.error('Error fetching comments:', error);
//         return {};
//     });
// }

// function displayCommentsForReview(comments, container) {
//     if (!comments || comments.length === 0) {
//         const noComments = document.createElement('p');
//         noComments.textContent = 'No comments yet.';
//         container.appendChild(noComments);
//         return;
//     }

//     comments.forEach(comment => {
//         const commentDiv = document.createElement('div');
//         commentDiv.classList.add('comment');
//         commentDiv.style.marginLeft = '20px';

//         commentDiv.innerHTML = `
//             <p><strong>Member ID:</strong> ${comment.memberId}</p>
//             <p>${comment.commentText}</p>
//             <p><small>Created At: ${new Date(comment.createdAt).toLocaleString()}</small></p>
//         `;
//         container.appendChild(commentDiv);
//     });
// }

// function fetchProductReviews(productId, commentsByReview) {
//     const token = localStorage.getItem("token");
//     let url = `/reviews?productId=${productId}`;

//     return fetch(url, {
//         headers: {
//             Authorization: `Bearer ${token}`
//         }
//     })
//     .then(response => response.json())
//     .then(body => {
//         if (body.error) throw new Error(body.error);
//         const reviews = body.reviews;

//         const reviewsContainer = document.querySelector('#reviews-container');
//         reviewsContainer.innerHTML = '';

//         reviews.forEach(review => {
//             const reviewDiv = document.createElement('div');
//             reviewDiv.classList.add('review-row');
//             reviewDiv.style.marginBottom = '20px';

//             let ratingStars = '';
//             for (let i = 0; i < review.rating; i++) {
//                 ratingStars += '⭐';
//             }

//             reviewDiv.innerHTML += `
//                 <hr>            
//                 <h3>Member Username: ${review.username}</h3>
//                 <p>Rating: ${ratingStars}</p>
//                 <p>Review Text: ${review.reviewText}</p>
//                 <p>Last Updated: ${review.updatedAt ? new Date(review.updatedAt).toLocaleString() : ""}</p>
//                 <hr>
//             `;

//             // Comment form
//             const commentForm = document.createElement('form');
//             commentForm.classList.add('comment-form');
//             commentForm.innerHTML = `
//                 <textarea name="comment_text" rows="3" style="width: 100%; padding: 8px;" placeholder="Write your comment here..." required></textarea>
//                 <br>
//                 <button type="submit" style="margin-top: 5px;">Post Comment</button>
//             `;

//             commentForm.addEventListener('submit', function (e) {
//                 e.preventDefault();
//                 const commentText = commentForm.querySelector('textarea[name=comment_text]').value;

//                 fetch('/comments', {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                         Authorization: `Bearer ${token}`
//                     },
//                     body: JSON.stringify({
//                         review_id: review.id,
//                         comment_text: commentText
//                     })
//                 })
//                 .then(res => res.json())
//                 .then(data => {
//                     if (data.error) throw new Error(data.error);
//                     alert('Comment posted!');
//                     location.reload();
//                 })
//                 .catch(err => {
//                     console.error('Error posting comment:', err);
//                     alert('Failed to post comment.');
//                 });
//             });

//             reviewDiv.appendChild(commentForm);

//             // Append comments under the review
//             const commentsContainer = document.createElement('div');
//             commentsContainer.classList.add('comments-container');
//             displayCommentsForReview(commentsByReview[review.id], commentsContainer);
//             reviewDiv.appendChild(commentsContainer);

//             reviewsContainer.appendChild(reviewDiv);
//         });
//     })
//     .catch(error => {
//         console.error(error);
//     });
// }

// document.addEventListener('DOMContentLoaded', function () {
//     const productId = localStorage.getItem("productId");

//     fetchProduct(productId)
//         .then(() => fetchCommentsByProduct(productId))
//         .then(commentsByReview => fetchProductReviews(productId, commentsByReview))
//         .catch(error => {
//             console.error(error);
//         });
// });

// Helper to parse JWT token payload
function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Get current logged in member id from JWT token
function getLoggedInMemberId() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('No token found');
    return null;
  }
  const payload = parseJwt(token);
  console.log('JWT payload:', payload);
  const id = payload ? (payload.memberId || payload.id) : null;
  console.log('Extracted member ID from token:', id);
  return id ? Number(id) : null;
}

// Helper to create DOM elements
function createElement(tag, options = {}) {
  const el = document.createElement(tag);
  if (options.classNames) el.classList.add(...options.classNames);
  if (options.text) el.textContent = options.text;
  if (options.html) el.innerHTML = options.html;
  if (options.attrs) {
    for (const [key, value] of Object.entries(options.attrs)) {
      el.setAttribute(key, value);
    }
  }
  if (options.styles) {
    Object.assign(el.style, options.styles);
  }
  return el;
}

// Fetch product and display in table
async function fetchProduct(productId) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`/products/${productId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const body = await res.json();
    if (body.error) throw new Error(body.error);
    const product = body.product;

    const tbody = document.querySelector('#product-tbody');
    tbody.innerHTML = ''; // Clear existing

    const row = createElement('tr', { classNames: ['product'] });

    row.appendChild(createElement('td', { text: product.name }));
    row.appendChild(createElement('td', { text: product.description }));
    row.appendChild(createElement('td', { text: product.unitPrice }));
    row.appendChild(createElement('td', { text: product.country }));
    row.appendChild(createElement('td', { text: product.productType }));

    const imgCell = createElement('td');
    const img = createElement('img', { attrs: { src: product.imageUrl, alt: 'Product Image' } });
    imgCell.appendChild(img);
    row.appendChild(imgCell);

    row.appendChild(
      createElement('td', { text: new Date(product.manufacturedOn).toLocaleString() })
    );

    tbody.appendChild(row);
  } catch (error) {
    console.error('Error fetching product:', error);
  }
}

// Fetch all comments for a product, grouped by review_id
async function fetchCommentsByProduct(productId) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`/comments/review?productId=${productId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const body = await res.json();
    if (body.error) throw new Error(body.error);

    const commentsByReview = {};
    if (Array.isArray(body.comments)) {
      body.comments.forEach(comment => {
        if (!commentsByReview[comment.reviewId]) commentsByReview[comment.reviewId] = [];
        commentsByReview[comment.reviewId].push(comment);
      });
    }
    return commentsByReview;
  } catch (error) {
    console.error('Error fetching comments:', error);
    return {};
  }
}

// Render comments inside a container with outline and Delete button if allowed
function renderComments(comments, container) {
  container.innerHTML = '';
  if (!comments || comments.length === 0) {
    container.appendChild(createElement('p', { text: 'No comments yet.' }));
    return;
  }

  const loggedInMemberId = getLoggedInMemberId();

  comments.forEach(comment => {
    const commentDiv = createElement('div', {
      classNames: ['comment'],
      styles: {
        marginLeft: '20px',
        marginBottom: '10px',
        border: '1px solid #ccc',
        padding: '8px',
        borderRadius: '4px',
        backgroundColor: '#fafafa',
        position: 'relative',
      }
    });

    commentDiv.appendChild(
      createElement('p', { html: `<strong>Member ID:</strong> ${comment.memberId}` })
    );
    commentDiv.appendChild(createElement('p', { text: comment.commentText }));
    commentDiv.appendChild(
      createElement('p', {
        html: `<small>Created At: ${new Date(comment.createdAt).toLocaleString()}</small>`
      })
    );

    // Delete button for own comments
    if (loggedInMemberId && loggedInMemberId === comment.memberId) {
      const deleteBtn = createElement('button', {
        text: 'Delete',
        classNames: ['delete-comment-btn'],
        styles: {
          position: 'absolute',
          top: '8px',
          right: '8px',
          backgroundColor: '#e74c3c',
          color: '#fff',
          border: 'none',
          padding: '4px 8px',
          borderRadius: '3px',
          cursor: 'pointer'
        }
      });

      deleteBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this comment?')) {
            console.log('Full comment object:', comment);
            const numericCommentId = Number(comment.commentId);
            const numericMemberId = Number(getLoggedInMemberId());

            console.log('Delete button clicked:', {
                numericCommentId,
                numericMemberId,
                commentIdType: typeof numericCommentId,
                memberIdType: typeof numericMemberId,
            });
    
            // if (isNaN(numericCommentId) || isNaN(numericMemberId)) {
            //     alert('Invalid comment or member ID.');
            // return;
            // }
    
            deleteComment(numericCommentId, numericMemberId, container, commentDiv);
        }
      });

      commentDiv.appendChild(deleteBtn);
    }

    container.appendChild(commentDiv);
  });
}

// Fetch and display product reviews with their comments and comment form
async function fetchProductReviews(productId, commentsByReview) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`/reviews?productId=${productId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const body = await res.json();
    if (body.error) throw new Error(body.error);

    const reviewsContainer = document.querySelector('#reviews-container');
    reviewsContainer.innerHTML = '';

    body.reviews.forEach(review => {
      const reviewDiv = createElement('div', {
        classNames: ['review-row'],
        styles: { marginBottom: '20px' }
      });

      let ratingStars = '⭐'.repeat(review.rating);

      reviewDiv.appendChild(
        createElement('h3', { text: `Member Username: ${review.username}` })
      );
      reviewDiv.appendChild(createElement('p', { text: `Rating: ${ratingStars}` }));
      reviewDiv.appendChild(createElement('p', { text: `Review Text: ${review.reviewText}` }));
      reviewDiv.appendChild(
        createElement('p', {
          text: `Last Updated: ${
            review.updatedAt ? new Date(review.updatedAt).toLocaleString() : ''
          }`
        })
      );

      // Comment form
      const commentForm = createElement('form', { classNames: ['comment-form'] });
      commentForm.innerHTML = `
        <textarea name="comment_text" rows="3" style="width: 100%; padding: 8px;" placeholder="Write your comment here..." required></textarea>
        <br>
        <button type="submit" style="margin-top: 5px;">Post Comment</button>
      `;
      commentForm.addEventListener('submit', async e => {
        e.preventDefault();
        const commentText = commentForm.querySelector('textarea[name=comment_text]').value;

        try {
          const postRes = await fetch('/comments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              review_id: review.id,
              comment_text: commentText
            })
          });
          const postData = await postRes.json();
          if (postData.error) throw new Error(postData.error);
          alert('Comment posted!');
          location.reload();
        } catch (err) {
          console.error('Error posting comment:', err);
          alert('Failed to post comment.');
        }
      });
      reviewDiv.appendChild(commentForm);

      // Comments container (nested under the review)
      const commentsContainer = createElement('div', { classNames: ['comments-container'] });
      renderComments(commentsByReview[review.id], commentsContainer);
      reviewDiv.appendChild(commentsContainer);

      reviewsContainer.appendChild(reviewDiv);
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
  }
}

// Delete comment API call and update UI
function deleteComment(commentId, memberId, commentsContainer, commentDiv) {
    console.log('Attempting to delete comment with:', {
        commentId,
        memberId,
        commentIdType: typeof commentId,
        memberIdType: typeof memberId,
    });

    if (isNaN(commentId) || isNaN(memberId)) {
        alert('Error: commentId or memberId is not a valid number.');
        return;
    }

  const token = localStorage.getItem('token');

  fetch('/comments/delete', {  // change endpoint if different
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ comment_id: commentId, member_id: memberId })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) throw new Error(data.error);

    // Remove deleted comment from UI
    commentsContainer.removeChild(commentDiv);

    alert('Comment deleted successfully!');
  })
  .catch(err => {
    console.error('Failed to delete comment:', err);
    alert('Failed to delete comment.');
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const productId = localStorage.getItem('productId');

  await fetchProduct(productId);

  const commentsByReview = await fetchCommentsByProduct(productId);

  await fetchProductReviews(productId, commentsByReview);
});
