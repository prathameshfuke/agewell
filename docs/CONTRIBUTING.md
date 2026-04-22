# Contributing to AgeWell

Thank you for your interest in contributing to AgeWell! This guide will help you get started.

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Git
- Tesseract OCR 5.5.0
- A Supabase account

### Setup Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/agewell.git
   cd agewell
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   
   # Windows
   .\venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Database Setup**
   - Create Supabase project
   - Run migrations from `supabase/schema.sql`
   - Configure Google OAuth provider

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

Example: `feature/medication-reminders`

### Making Changes

1. Create a new branch:
   ```bash
   git checkout -b feature/my-feature
   ```

2. Make your changes

3. Test your changes:
   ```bash
   # Backend tests
   cd backend
   python -m pytest
   
   # Frontend build check
   cd frontend
   npm run build
   ```

4. Commit with clear messages:
   ```bash
   git commit -m "Add medication reminder notifications
   
   - Add WhatsApp reminder service
   - Schedule reminders based on medication times
   - Add user preference settings"
   ```

5. Push and create Pull Request:
   ```bash
   git push origin feature/my-feature
   ```

## Code Style

### Python

- Follow PEP 8
- Use type hints where appropriate
- Maximum line length: 100 characters
- Use docstrings for functions and classes

Example:
```python
def calculate_adherence(user_id: int, days: int = 7) -> Dict:
    """
    Calculate medication adherence rate.
    
    Args:
        user_id: The user's ID
        days: Number of days to analyze
        
    Returns:
        Dict with adherence_rate, total, taken, missed
    """
    # Implementation
```

### JavaScript/React

- Use ESLint configuration
- Prefer functional components
- Use hooks for state management
- Use descriptive variable names

Example:
```jsx
// Good
function MedicationCard({ medication, onTaken }) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleMarkTaken = async () => {
    setIsLoading(true);
    await onTaken(medication.id);
    setIsLoading(false);
  };
  
  return (
    <Card>
      <h3>{medication.name}</h3>
      <Button onClick={handleMarkTaken} disabled={isLoading}>
        {isLoading ? 'Marking...' : 'Mark Taken'}
      </Button>
    </Card>
  );
}
```

## Project Structure Guidelines

### Backend

- **Routes**: Handle HTTP requests, validate input, return responses
- **Services**: Contain business logic, can call other services
- **Models**: Define database schema, minimal logic

### Frontend

- **Pages**: Route-level components
- **Components**: Reusable UI components
- **Hooks**: Custom React hooks for data fetching
- **Contexts**: Global state management
- **API**: Backend communication layer

## Testing

### Backend Tests

```python
def test_health_reading_creation():
    """Test adding a health reading."""
    response = client.post('/api/health/readings', json={
        'user_id': 1,
        'spo2': 98,
        'heart_rate': 72
    })
    assert response.status_code == 200
    assert response.json['success'] is True
```

### Frontend Tests

```javascript
describe('MedicationCard', () => {
  it('calls onTaken when mark taken button clicked', async () => {
    const mockOnTaken = jest.fn();
    render(<MedicationCard medication={mockMed} onTaken={mockOnTaken} />);
    
    fireEvent.click(screen.getByText('Mark Taken'));
    
    await waitFor(() => {
      expect(mockOnTaken).toHaveBeenCalledWith(mockMed.id);
    });
  });
});
```

## Documentation

- Update README.md if adding major features
- Document new API endpoints in docs/API.md
- Add JSDoc comments to complex functions
- Update CHANGELOG.md with your changes

## Commit Message Guidelines

Format:
```
type: subject

body (optional)

footer (optional)
```

Types:
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only
- **style**: Code style (formatting, semicolons)
- **refactor**: Code refactoring
- **test**: Adding tests
- **chore**: Build process, dependencies

Examples:
```
feat: add WhatsApp medication reminders

Implement scheduled reminders using Twilio API.
Users can now receive WhatsApp messages when
medications are due.

fix: correct adherence calculation for timezone

The previous calculation didn't account for timezone
differences, causing incorrect stats for users
outside UTC.
```

## Pull Request Process

1. Ensure tests pass
2. Update documentation
3. Fill out PR template:
   - What changed?
   - Why?
   - Testing done?
4. Request review from maintainers
5. Address review comments
6. Squash commits if requested

## Code Review Guidelines

### For Reviewers

- Be respectful and constructive
- Focus on the code, not the person
- Explain the "why" behind suggestions
- Approve when ready, don't delay unnecessarily

### For Authors

- Respond to all comments
- Ask questions if unclear
- Make requested changes promptly
- Keep PRs focused and reasonably sized

## Areas for Contribution

### High Priority

- [ ] Complete test coverage
- [ ] Mobile app (React Native/Flutter)
- [ ] Voice memo transcription
- [ ] Additional health device integrations

### Good First Issues

- [ ] UI polish and animations
- [ ] Additional language translations
- [ ] Accessibility improvements
- [ ] Documentation updates
- [ ] Bug fixes

### Feature Ideas

- Video calling between elder and caregiver
- Integration with smartwatches/fitness trackers
- Medication interaction checker
- Family communication features
- Multi-language support
- Offline mode capabilities

## Community

- Join discussions in GitHub Issues
- Ask questions before starting major work
- Share your use cases and feedback

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions or ideas
- Contact maintainers directly for sensitive issues

Thank you for contributing to AgeWell!
